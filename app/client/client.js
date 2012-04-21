(function() {

  var OBH = {
    TIME_TO_GUESS: 8, // seconds
    TIME_AFTER_GUESS_BEFORE_NEXT_BOUNTY: 3000, // ms
    DISCRETE_GUESS_CHUNKS: 7,
    TIME_BEFORE_FINAL_SCREEN: 2500,
    templates: {
      splash: function() {
        Template.splash.events = {
          'click .single': function() {
            OBH.showBounty( 0 );
          }
        };

        return Template.splash;
      },
      game: function() {
        Template.game.bounties = function() {

          return Bounties.find();
        };

        return Template.game;
      },
      final: function()
      {
        Template.final.events = {
          'click .play-again': function() {
            document.location.href = document.location.pathname;
          }
        };
        return Template.final;
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

      var $guess = $bounty.find( '.guess' ),
          $guessValue = $bounty.find( '.guess-value' ),
          $inputHint = $bounty.find( '.inputhint' ),
          $result = $bounty.find( '.result' ),
          $timer = $bounty.find( '.timer' ),
          counter = OBH.TIME_TO_GUESS;

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
            var src = results[0].url,
                $img = $bounty.find( 'img' ),
                originalSrc = $img.attr( 'src' );

            $img.attr( 'src', src ).bind('error', function() {
              $img.attr( 'src', originalSrc );
            });
          }
        }
      });

      $guess.bind( 'change.obh-guess', function( event, ui ) {
        var $t = $( this );

          $guessValue.html( '$' + $t.val() );
          $t.trigger( 'blur' );
      });

      $guessValue.html( '$' + parseInt( $guess.val(), 10 ) );

      function timer() {
        $timer.html( counter ); // + ' second' + ( counter != 1 ? 's' : '' ) );

        if ( counter <= 0 ) {
          var actual = bounty.value,
              guess = parseFloat( $guess.val() ),
              offset = Math.abs( actual - guess ),
              percentage = ( offset * 100 / actual ).toFixed( 2 );

          $guess.slider( 'disable' )
            .unbind( 'change.obh-guess' );

          $result.find( '.actual-value' ).html( '$' + actual );
          $inputHint.hide();
          $result.show();

          var min = parseFloat( $bounty.find( '.min ' ).html().replace( /\$/, '' ) ),
              max = parseFloat( $bounty.find( '.max ' ).html().replace( /\$/, '' ) ),
              step = ( max - min ) / OBH.DISCRETE_GUESS_CHUNKS;

          if ( ( guess < ( actual - step ) ) || ( guess > ( actual + step ) ) ) {
            $bounty.addClass( 'wrong' );

            // TODO show final score and call to action
            window.setTimeout(function()
            {
              $.mobile.changePage( $( '#final' ) );
            }, OBH.TIME_BEFORE_FINAL_SCREEN);

          } else {
            $bounty.addClass( 'right' );

            if ( guess == actual ) {
              $result.find( '.drilled-it' ).html( 'DRILLED IT' );
              $("audio")[0].play();
            }

            Session.set( 'score', Session.get( 'score' ) + 1 );

            // move to next slide
            window.setTimeout(function() {
              OBH.showBounty( index + 1 );
            }, OBH.TIME_AFTER_GUESS_BEFORE_NEXT_BOUNTY);
          }

          return;
        }

        counter--;
        window.setTimeout(timer, 1000);
      }

      timer();
    },
    getRenderedPage: function( name ) {
      var template = OBH.templates[ name ],
          content;

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

  Template.progress.bounty = function() {
    return Session.get( 'bounty' );
  };

  Template.progress.score = function() {
    return Session.get( 'score' );
  };

  Template.final.score = function() {
    return Session.get( 'score' );
  };

  Meteor.startup(function () {
    $.getScript( 'jquery.mobile-1.1.0.js' );

    Meteor.subscribe( 'bounties' );

    $( document.body ).obhAddPages( [ 'splash', 'game', 'final' ] );

    var count = 0;
    Bounties.find().observe( {
      added: function( bounty ) {
        Meteor.flush();
        $( '.bounty' ).eq( count ).data( 'bounty', bounty );
        count++;
      }
    });

    Session.set( 'score', 0 );
  });

  Handlebars.registerHelper( 'bountyLabel', function( count ) {
    return count != 1 ? 'bounties' : 'bounty';
  });

  Handlebars.registerHelper( 'getSliderHtml', function( value ) {
    function log10(val) {
      return Math.log(val) / Math.log(10);
    }

    var min = -1,
      step = Math.pow( 9, Math.floor( log10( value ) ) ),
      below = Math.round( Math.random() * OBH.DISCRETE_GUESS_CHUNKS ), // 0..7
      above = OBH.DISCRETE_GUESS_CHUNKS - below, // 7 - 0..7
      max,
      startingGuess;

    while( min < 0 ) {
      min = ( value - below * step ).toFixed( 2 );
      max = ( value + above * step ).toFixed( 2 );
      below--;
      above++;
    }

    //startingGuess = ( max - min ) * Math.random() + min; //( max * .5 ).toFixed( 2 );
    startingGuess = min;

    return '<p><span class="max">$' + max + '</span><span class="min">$' + min + '</span></p><input type="range" name="slider" value="' + startingGuess + '" min="' + min + '" max="' + max + '" step="' + step + '" class="guess">';
  });

})();
