var url = require('url');
var io = require("socket.io-client");
var stripAnsi = require('strip-ansi');

var urlParts;
if (typeof __resourceQuery === "string" && __resourceQuery) {
	urlParts = url.parse(__resourceQuery.substr(1));
} else {
	var scriptElements = document.getElementsByTagName("script");
	urlParts = url.parse(scriptElements[scriptElements.length-1].getAttribute("src").replace(/\/[^\/]+$/, ""))
}

io = io.connect(
	url.format({
		protocol: urlParts.protocol,
		auth: urlParts.auth,
		hostname: (urlParts.hostname === '0.0.0.0') ? window.location.hostname : urlParts.hostname,
		port: urlParts.port
	}), {
		path: urlParts.path === '/' ? null : urlParts.path
	}
);

var hot = false;
var initial = true;
var currentHash = "";

io.on("hot", function() {
	hot = true;
	console.log("[WDS] Hot Module Replacement enabled.");
});

io.on("invalid", function() {
	console.log("[WDS] App updated. Recompiling...");
});

io.on("hash", function(hash) {
	currentHash = hash;
});

io.on("still-ok", function() {
	console.log("[WDS] Nothing changed.")
});

io.on("ok", function() {
	if(initial) return initial = false;
	reloadApp();
});

io.on("warnings", function(warnings) {
	console.log("[WDS] Warnings while compiling.");
	for(var i = 0; i < warnings.length; i++)
		console.warn(stripAnsi(warnings[i]));
	if(initial) return initial = false;
	reloadApp();
});

io.on("errors", function(errors) {
	console.log("[WDS] Errors while compiling.");
	for(var i = 0; i < errors.length; i++)
		console.error(stripAnsi(errors[i]));
	if(initial) return initial = false;
	reloadApp();
});

io.on("proxy-error", function(errors) {
	console.log("[WDS] Proxy error.");
	for(var i = 0; i < errors.length; i++)
		console.error(stripAnsi(errors[i]));
	if(initial) return initial = false;
	reloadApp();
});

io.on("disconnect", function() {
	console.error("[WDS] Disconnected!");
});

function reloadApp() {
	if(hot) {
		console.log("[WDS] App hot update...");
		window.postMessage("webpackHotUpdate" + currentHash, "*");
	} else {
		console.log("[WDS] App updated. Reloading...");
		window.location.reload();
	}
}
