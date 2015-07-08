## metronic rabbit
A library that provides both publishing and subscribing adapters for metronic. This allows a service to publish metrics to a rabbit exchange and have downstream subscribers use other metronic adapters to integrate with various APM tools. (statsd, graphite, boundary, etc.)

## Publish

## Configuration

```javascript
// defaults shown
{
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
}
```

## Use
```javascript
var metronic = require( "metronic" )();
var config = { ... };
var publisher = require( "metronic-rabbit" )
	.publisher( config );
metronic.use( publisher );
```

## Subscribe

## Configuration

```javascript
// defaults shown
{
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
		topics: []
	}
}
```

## Use
```javascript
var metronic = require( "metronic" )();
// default values shown
var statsd = require( "metronic-statsd" )(
	{
		server: "localhost"
		port: 8125
	}
);
metronic.use( statsd );

var config = { ... };
require( "metronic-rabbit" )
	.subscriber( metronic, config );
```
