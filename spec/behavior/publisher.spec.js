require( "../setup" );

describe( "Publisher", function() {
	describe( "without configuration", function() {
		var adapter, rabbit, stamp;
		before( function() {
			var setup = getSetup();
			adapter = setup.publisher();
			rabbit = setup.rabbit;
			adapter.setConverter( require( "metronic/convert" ) );
			stamp = Date.now();
			adapter.onMetric( {
				type: "time",
				key: "test.duration",
				value: 1,
				units: "s",
				timestamp: stamp
			} );
			adapter.onMetric( {
				type: "meter",
				key: "test.meter",
				value: 1,
				units: "",
				timestamp: stamp
			} );
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
				bindings: [
					{ exchange: "metronic-all-ex", target: "metronic-topic-ex", keys: [] }
				]
			} );
		} );

		it( "should capture correct measures", function() {
			rabbit.published.should.eql( [
				{
					exchange: "metronic-all-ex",
					message: {
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
				},
				{
					exchange: "metronic-all-ex",
					message: {
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
				}
			] );
		} );
	} );

	describe( "with configuration", function() {
		var adapter, rabbit, stamp;
		var config = {
			fanout: "all.metrics",
			topic: "topic.metrics",
			connection: {
				server: "my.rabbit.server",
				vhost: "%2fmetrics"
			}
		};
		before( function() {
			var setup = getSetup();
			adapter = setup.publisher( config );
			rabbit = setup.rabbit;
			adapter.setConverter( require( "metronic/convert" ) );
			stamp = Date.now();
			adapter.onMetric( {
				type: "time",
				key: "test.duration",
				value: 1,
				units: "s",
				timestamp: stamp
			} );
			adapter.onMetric( {
				type: "meter",
				key: "test.meter",
				value: 1,
				units: "",
				timestamp: stamp
			} );
		} );

		it( "should pass modified configuration on to rabbit", function() {
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
				bindings: [
					{ exchange: "all.metrics", target: "topic.metrics", keys: [] }
				]
			} );
		} );

		it( "should capture correct measures", function() {
			rabbit.published.should.eql( [
				{
					exchange: "all.metrics",
					message: {
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
				},
				{
					exchange: "all.metrics",
					message: {
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
				}
			] );
		} );
	} );
} );

function getSetup() {
	var rabbitMock = {
		config: {},
		published: [],
		configure: function( cfg ) {
			this.config = cfg;
		},
		publish: function( exchange, message ) {
			this.published.push( { exchange: exchange, message: message } );
		}
	};
	var adapters = proxyquire( "../src/index", {
		wascally: rabbitMock
	} );
	return {
		rabbit: rabbitMock,
		publisher: adapters.publisher
	};
}
