require( "../setup" );

describe( "Subscriber", function() {
	describe( "with missing queue name", function() {
		var setup, metronic;
		before( function() {
			setup = getSetup();
			metronic = getMetronic();
		} );

		it( "should throw queue missing error", function() {
			expect( function() {
				setup.subscriber( metronic, {} );
			} ).to.throw(
				"Metronic Subscriber requires a queue to be set in the configuration."
			);
		} );
	} );

	describe( "without configuration", function() {
		var adapter, rabbit, metronic, stamp;
		before( function() {
			var setup = getSetup();
			metronic = getMetronic();
			adapter = setup.subscriber( metronic, {
				queue: { name: "metronic-queue" }
			} );
			rabbit = setup.rabbit;
			stamp = Date.now();
			rabbit.emit(
				"",
				{
					correlationId: undefined,
					routingKey: "test.duration",
					type: "metronic.time",
					body: {
						key: "test.duration",
						timestamp: stamp,
						type: "time",
						units: "ms",
						value: 1000
					}
				}
			);
			rabbit.emit(
				"",
				{
					correlationId: undefined,
					routingKey: "test.meter",
					type: "metronic.meter",
					body: {
						key: "test.meter",
						timestamp: stamp,
						type: "meter",
						units: "",
						value: 1
					}
				}
			);
		} );

		it( "should pass default configuration on to rabbit", function() {
			rabbit.config.should.eql( {
				connection: {
					name: "metronic",
					user: "guest",
					pass: "guest",
					server: "127.0.0.1",
					port: 5672,
					timeout: 2000,
					vhost: "%2f"
				},
				exchanges: [
					{ name: "metronic-all-ex", type: "fanout" },
					{ name: "metronic-topic-ex", type: "topic" }
				],
				queues: [
					{
						name: "metronic-queue",
						autoDelete: true,
						durable: false,
						persistent: false,
						noAck: true,
						subscribe: true,
						topics: []
					}
				],
				bindings: [
					{ exchange: "metronic-all-ex", target: "metronic-topic-ex", keys: [] },
					{ exchange: "metronic-all-ex", target: "metronic-queue", keys: [] }
				]
			} );
		} );

		it( "should capture correct measures", function() {
			metronic.metrics.should.eql( [
				{
					key: "test.duration",
					type: "time",
					units: "ms",
					value: 1000,
					meta: {
						timestamp: stamp
					}
				},
				{
					key: "test.meter",
					type: "meter",
					units: "",
					value: 1,
					meta: {
						timestamp: stamp
					}
				}
			] );
		} );
	} );

	describe( "with configuration", function() {
		var adapter, rabbit, metronic, stamp;
		before( function() {
			var setup = getSetup();
			metronic = getMetronic();
			adapter = setup.subscriber( metronic, {
				fanout: "all.metrics",
				topic: "topic.metrics",
				queue: { name: "metronic-queue" },
				connection: {
					server: "my.rabbit.server",
					vhost: "%2fmetrics"
				}
			} );
			rabbit = setup.rabbit;
			stamp = Date.now();
			rabbit.emit(
				"",
				{
					correlationId: undefined,
					routingKey: "test.duration",
					type: "metronic.time",
					body: {
						key: "test.duration",
						timestamp: stamp,
						type: "time",
						units: "ms",
						value: 1000
					}
				}
			);
			rabbit.emit(
				"",
				{
					correlationId: undefined,
					routingKey: "test.meter",
					type: "metronic.meter",
					body: {
						key: "test.meter",
						timestamp: stamp,
						type: "meter",
						units: "",
						value: 1
					}
				}
			);
		} );

		it( "should pass default configuration on to rabbit", function() {
			rabbit.config.should.eql( {
				connection: {
					name: "metronic",
					user: "guest",
					pass: "guest",
					server: "my.rabbit.server",
					port: 5672,
					timeout: 2000,
					vhost: "%2fmetrics"
				},
				exchanges: [
					{ name: "all.metrics", type: "fanout" },
					{ name: "topic.metrics", type: "topic" }
				],
				queues: [
					{
						name: "metronic-queue",
						autoDelete: true,
						durable: false,
						persistent: false,
						noAck: true,
						subscribe: true,
						topics: []
					}
				],
				bindings: [
					{ exchange: "all.metrics", target: "topic.metrics", keys: [] },
					{ exchange: "all.metrics", target: "metronic-queue", keys: [] }
				]
			} );
		} );

		it( "should capture correct measures", function() {
			metronic.metrics.should.eql( [
				{
					key: "test.duration",
					type: "time",
					units: "ms",
					value: 1000,
					meta: {
						timestamp: stamp
					}
				},
				{
					key: "test.meter",
					type: "meter",
					units: "",
					value: 1,
					meta: {
						timestamp: stamp
					}
				}
			] );
		} );
	} );

	describe( "with specific topics", function() {
		var adapter, rabbit, metronic;
		before( function() {
			var setup = getSetup();
			metronic = getMetronic();
			adapter = setup.subscriber( metronic, {
				fanout: "all.metrics",
				topic: "topic.metrics",
				queue: { name: "metronic-queue", topics: [ "topic.one", "topic.two" ] },
				connection: {
					server: "my.rabbit.server",
					vhost: "%2fmetrics"
				}
			} );
			rabbit = setup.rabbit;
		} );

		it( "should pass default configuration on to rabbit", function() {
			rabbit.config.should.eql( {
				connection: {
					name: "metronic",
					user: "guest",
					pass: "guest",
					server: "my.rabbit.server",
					port: 5672,
					timeout: 2000,
					vhost: "%2fmetrics"
				},
				exchanges: [
					{ name: "all.metrics", type: "fanout" },
					{ name: "topic.metrics", type: "topic" }
				],
				queues: [
					{
						name: "metronic-queue",
						autoDelete: true,
						durable: false,
						persistent: false,
						noAck: true,
						subscribe: true,
						topics: [ "topic.one", "topic.two" ]
					}
				],
				bindings: [
					{ exchange: "all.metrics", target: "topic.metrics", keys: [] },
					{ exchange: "topic.metrics", target: "metronic-queue", keys: [ "topic.one", "topic.two" ] }
				]
			} );
		} );
	} );
} );

function getSetup() {
	var rabbitMock = {
		config: {},
		handles: {},
		configure: function( cfg ) {
			this.config = cfg;
		},
		emit: function( type, msg ) {
			this.handles[ "#" ]( msg );
		},
		handle: function( type, h ) {
			this.handles[ "#" ] = h;
		}
	};
	var adapters = proxyquire( "../src/index", {
		wascally: rabbitMock
	} );
	return {
		rabbit: rabbitMock,
		subscriber: adapters.subscriber
	};
}

function getMetronic() {
	return {
		metrics: [],
		emitMetric: function( type, units, key, value, meta ) {
			this.metrics.push( {
				type: type,
				units: units,
				key: key,
				value: value,
				meta: meta
			} );
		}
	};
}
