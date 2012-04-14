// Template.splash.greeting = function () {
//   return "Welcome to obh.";
// };

var OBH = {
  templates: {
    bounty: function() {
      return Template.bounty;
    },
    splash: function() {
      Template.splash.events = {
        'click .single': function() {
          OBH.addPage( 'bounty' );
          OBH.changePage( 'bounty' );
        }
      };

      return Template.splash;
    }
  },
  changePage: function( name )
  {
    $.mobile.changePage( $( '#' + name ) );
  },
  addPage: function( name, vars ) {
    var template = OBH.templates[ name ];

    if ( template ) {
      $( document.body ).append( Meteor.ui.render( template( vars ) ) );
    }
  },
  addPages: function( names ) {
    _.each(names, function( name ) {
      OBH.addPage( name );
    });
  }
};

Meteor.startup(function () {
  //$( '<link>' ).attr( 'href', 'jquery.mobile-1.1.0.css' ).appendTo( 'head' );
  $.getScript( 'jquery.mobile-1.1.0.js' );

  OBH.addPages( [ 'splash', 'bounty' ] );
});