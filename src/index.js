var convert;
var _ = require( "lodash" );
var rabbit = require( "wascally" );

var publisherDefaults = {
	fanout: "metronic-all-ex",
	topic: "metronic-topic-ex",
	connection: {
		name: "metronic",
		user: "guest",
		pass: "guest",
		server: "127.0.0.1",
		port: 5672,
		timeout: 2000,
		vhost: "%2f"
	}
};

var subscriberDefaults = {
	fanout: "metronic-all-ex",
	topic: "metronic-topic-ex",
	connection: {
		name: "metronic",
		user: "guest",
		pass: "guest",
		server: "127.0.0.1",
		port: 5672,
		timeout: 2000,
		vhost: "%2f"
	},
	queue: {
		autoDelete: true,
		durable: false,
		persistent: false,
		noAck: true,
		subscribe: true,
		topics: []
	}
};

function publisher( cfg ) {
	var config = _.merge( {}, publisherDefaults, cfg );
	var connectionName = config.connection.name;
	rabbit.configure( {
		connection: config.connection,
		exchanges: [
			{ name: config.fanout, type: "fanout" },
			{ name: config.topic, type: "topic" }
		],
		bindings: [
			{ exchange: config.fanout, target: config.topic, keys: [] }
		]
	} );
	return {
		onMetric: function( data ) {
			if ( data.type === "time" ) {
				data.value = convert( data.value, data.units, "ms" );
				data.units = "ms";
			}
			rabbit.publish( config.fanout,
				{
					body: data,
					correlationId: data.correlationId,
					routingKey: data.key,
					type: "metronic." + data.type
				}, connectionName );
		},
		setConverter: function( converter ) {
			convert = converter;
		}
	};
}

function subscriber( metronic, cfg ) {
	var config = _.merge( {}, subscriberDefaults, cfg );
	var queue = config.queue;
	if ( !queue.name ) {
		throw new Error( "Metronic Subscriber requires a queue to be set in the configuration." );
	}
	var binding = queue.topics.length ?
		{ exchange: config.topic, target: queue.name, keys: queue.topics } :
		{ exchange: config.fanout, target: queue.name, keys: [] };
	var setup = {
		connection: config.connection,
		exchanges: [
			{ name: config.fanout, type: "fanout" },
			{ name: config.topic, type: "topic" }
		],
		queues: [ queue ],
		bindings: [
			{ exchange: config.fanout, target: config.topic, keys: [] },
			binding
		]
	};
	rabbit.handle( "#", function( env ) {
		var msg = env.body;
		var meta = { timestamp: msg.timestamp };
		_.merge( meta, env.headers );
		_.merge( meta, _.omit( msg, [ "type", "key", "value", "units", "timestamp" ] ) );
		metronic.emitMetric( msg.type, msg.units, msg.key, msg.value, meta );
	} );
	rabbit.configure( setup );
}

module.exports = {
	publisher: publisher,
	subscriber: subscriber
};
