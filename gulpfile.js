var gulp = require( "gulp" );
var bg = require( "biggulp/common-gulp" )( gulp );

gulp.task( "ci-test", function() {
	return bg.testBehaviorOnce();
} );
