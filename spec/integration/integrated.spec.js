var metronic = require( "metronic" )();
var rabbit = require( "../../src/index" );
var publisher = rabbit.publisher();
metronic.use( publisher );

var mock = {
	deferred: undefined,
	metrics: [],
	emitMetric: function( type, units, key, value, meta ) {
		if ( this.deferred ) {
			this.deferred.resolve();
		}
		this.metrics.push( {
			type: type,
			units: units,
			key: key,
			value: value,
			meta: meta
		} );
	}
};
rabbit.subscriber( mock, { queue: { name: "metrics.queue" } } );

describe( "Integration", function() {
	var stamp;
	before( function() {
		mock.deferred = when.defer();
		stamp = Date.now();
		metronic.emitMetric( "test", "", "test.key", 10 );
		return mock.deferred.promise;
	} );

	it( "should receive published metrics", function() {
		mock.metrics.should.eql( [
			{
				type: "test",
				units: "",
				key: "test.key",
				value: 10,
				meta: {
					timestamp: stamp
				}
			}
		] );
	} );
} );
