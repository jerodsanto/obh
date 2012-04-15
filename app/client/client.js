var OBH = {
  templates: {
    splash: function() {
      Template.splash.events = {
        'click .single': function() {
          OBH.addPage( 'bounty' );
          Meteor.call( 'startSingle', function( error, result ) {
            Session.set( 'uuid', result );
            Meteor.call( 'join', Session.get( 'uuid' ) );
            Meteor.subscribe( 'bounties-' + Session.get( 'uuid' ) );
          } );
          OBH.changePage( 'bounty' );
        },
        'click .battle': function() {
          OBH.addPage( 'waiting' );
          OBH.changePage( 'waiting' );
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
