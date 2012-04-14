// Template.splash.greeting = function () {
//   return "Welcome to obh.";
// };

var OBH = {
  events: {
    getPageTransitions: function( eventMap ) {
      var events = {};

      _.each(eventMap, function( pageName, selector ) {
        events[ selector ] = function() {
          OBH.addPage( pageName );
          OBH.changePage( pageName );
        };
      });

      return events;
    },
  },
  templates: {
    splash: function() {
      Template.splash.events = OBH.events.getPageTransitions({
        'click .single': 'bounty',
        'click .battle': 'waiting'
      });

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
      content = template( vars );
    } else {
      content = Template[ name ]; 
    }

    $( document.body ).append( Meteor.ui.render( content ) );
  },
  addPages: function( names ) {
    _.each(names, function( name ) {
      OBH.addPage( name );
    });
  }
};

Meteor.startup(function () {
  $.getScript( 'jquery.mobile-1.1.0.js' );

  OBH.addPages( [ 'splash', 'bounty', 'waiting' ] );
});