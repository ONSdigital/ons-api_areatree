(function( jQuery ) {
  // Create the request object
  // (This is still attached to ajaxSettings for backward compatibility)
  jQuery.ajaxSettings.xdr = function() {
    return (window.XDomainRequest ? new window.XDomainRequest() : null);
  };

  // Determine support properties
  (function( xdr ) {
    jQuery.extend( jQuery.support, { iecors: !!xdr });
  })( jQuery.ajaxSettings.xdr() );

  // Create transport if the browser can provide an xdr
  if ( jQuery.support.iecors ) {

    jQuery.ajaxTransport(function( s ) {
    	var callback;
      return {
        send: function( headers, complete ) {
          var xdr = s.xdr();
          xdr.onload = function() {
        	  var headers = { 'Content-Type': xdr.contentType };
            complete(200, 'OK', { text: xdr.responseText }, headers);
          };
        
          xdr.onerror = function(){
        	  alert("xdr call failed");
          }
			xdr.open( s.type, s.url );
			xdr.send( ( s.hasContent && s.data ) || null );
        },

        abort: function() {
        	xdr.abort();
        }
      };
    });
  }
})( jQuery );
