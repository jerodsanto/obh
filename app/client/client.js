(function() {

  var OBH = {
    GUESS_MARGIN_OF_ERROR: 30, // percent
    TIME_TO_GUESS: 7, // seconds
    TIME_AFTER_GUESS_BEFORE_NEXT_BOUNTY: 3000, // ms
    DISCRETE_GUESS_CHUNKS: 10,
    templates: {
      splash: function() {
        Template.splash.events = {
          'click .single': function() {
            Meteor.call( 'startSingle', function( error, result ) {
              Session.set( 'uuid', result );
              Meteor.call( 'join', Session.get( 'uuid' ) );
              Meteor.subscribe( 'bounties-' + Session.get( 'uuid' ) );
            });

            var count = 0;
            Bounties.find().observe({
              added: function(bounty) {
                Meteor.flush();
                $( '.bounty' ).eq( count ).data( 'bounty', bounty );

                if ( count === 0 ) {
                  OBH.showBounty( 0 );
                }

                count++;
              }
            });
          }
        };

        return Template.splash;
      },
      game: function() {
        Template.game.bounties = function() {

          return Bounties.find();
        };

        return Template.game;
      }
    },
    showBounty: function( index ) {
      var $bounty = $( '.bounty' ).eq( index );

      if ( !$bounty.length ) {
        console.error( 'No bounty found for index: ', index );
        return;
      }

      var bounty = $bounty.data( 'bounty' );

      $.mobile.changePage( $bounty );

      $.ajax({
        dataType: 'jsonp',
        url: 'http://ajax.googleapis.com/ajax/services/search/images',
        data: {
          v: '1.0',
          imgsz: 'medium|large',
          rsz: 1,
          q: bounty.description
        },
        success: function(data) {
          var results = data.responseData.results;
          if (results.length) {
            var src = results[0].url;
            $bounty.find( 'img' ).attr( 'src', src );
          }
        }
      });

      var $guess = $bounty.find( '.guess' ),
          $guessValue = $bounty.find( '.guess-value' ),
          $timer = $bounty.find( '.timer' ),
          counter = OBH.TIME_TO_GUESS;

      $guess.bind( 'change.obh-guess', function( event, ui ) {
        var $t = $( this );

          $guessValue.html( '$' + $t.val() );
          $t.trigger( 'blur' );
      });

      function timer() {
        if ( counter <= 0 ) {
          var actual = bounty.value,
              guess = $guess.val(),
              offset = Math.abs( actual - guess ),
              percentage = ( offset * 100 / actual ).toFixed( 2 );

          $guess.slider( 'disable' )
            .unbind( 'change.obh-guess' );

          $timer.html( 'Actual: ' + actual + ', Off by $' + offset );

          if ( percentage > OBH.GUESS_MARGIN_OF_ERROR ) {
            $bounty.addClass( 'wrong' );
            // TODO show final score and call to action
          } else {
            $bounty.addClass( 'right' );

            Session.set( 'score', Session.get( 'score' ) + 1 );

            // move to next slide
            window.setTimeout(function() {
              OBH.showBounty( index + 1 );
            }, OBH.TIME_AFTER_GUESS_BEFORE_NEXT_BOUNTY);
          }

          return;
        }

        $timer.html( counter + ' second' + ( counter != 1 ? 's' : '' ) + ' remaining.' );

        counter--;
        window.setTimeout(timer, 1000);
      }

      timer();
    },
    getRenderedPage: function( name ) {
      var template = OBH.templates[ name ];

      if ( template ) {
        content = template();
      } else {
        content = Template[ name ];
      }

      return Meteor.ui.render( content );
    }
  };

  $.fn.obhAddPages = function( names ) {
    return this.each(function() {
      var $t = $( this );
      _.each(names, function( name ) {
        $t.append( OBH.getRenderedPage( name ) )
      });
    });
  };

  Template.scoreboard.score = function() {
    return Session.get( 'score' );
  };

  Meteor.startup(function () {
    $.getScript( 'jquery.mobile-1.1.0.js' );

    $( document.body ).obhAddPages( [ 'splash', 'game' ] );

    Session.set( 'score', 0 );
  });

  Handlebars.registerHelper( 'getSliderHtml', function( value ) {
    var min = 1,
        max = ( value * ( Math.random() + 1 ) ),
        step = parseInt( max / OBH.DISCRETE_GUESS_CHUNKS, 10 ),
        guess = 1; //( max * .5 ).toFixed( 2 );

    return '<input type="range" name="slider" value="' + guess + '" min="' + min + '" max="' + max + '" step="' + step + '" class="guess">';
  });

})();
