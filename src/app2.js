var resizePID;
var basemap = 'basemaps.cartocdn.com/light_all'

function clearResize() {
  clearTimeout(resizePID);
  resizePID = setTimeout(function() { adjustSlides(); }, 100);
}

if (!window.addEventListener) {
  window.attachEvent("resize", function load(event) {
    clearResize();
  });
} else {
  window.addEventListener("resize", function load(event) {
    clearResize();
  });
}

function adjustSlides() {
  var container = document.getElementById("slides_container"),
      slide = document.querySelectorAll('.selected_slide')[0];

  if (slide) {
    if (slide.offsetHeight+169+40+80 >= window.innerHeight) {
      container.style.bottom = "80px";

      var h = container.offsetHeight;

      slide.style.height = h-169+"px";
      slide.classList.add("scrolled");
    } else {
      container.style.bottom = "auto";
      container.style.minHeight = "0";

      slide.style.height = "auto";
      slide.classList.remove("scrolled");
    }
  }
}

var resizeAction = O.Action(function() {
  function imageLoaded() {
    counter--;

    if (counter === 0) {
      adjustSlides();
    }
  }
  var images = $('img');
  var counter = images.length;

  images.each(function() {
    if (this.complete) {
      imageLoaded.call( this );
    } else {
      $(this).one('load', imageLoaded);
    }
  });
});

function click(el) {
  var element = O.Core.getElement(el);
  var t = O.Trigger();

  // TODO: clean properly 
  function click() {
    t.trigger();
  }

  if (element) element.onclick = click;

  return t;
}





O.Template({
      init: function() {
        var baseurl = this.baseurl = 'http://{s}.'+ basemap +'/{z}/{x}/{y}.png';
        var map = this.map = L.map('map',{
          center: [0, 0],
          zoom: 4
        });

        this.map.scrollWheelZoom.disable();

        var basemap = this.basemap = L.tileLayer(baseurl, {
          attribution: 'data OSM - map CartoDB'
        }).addTo(map);

        var story = O.Story()

        this.story = story;
        this.miniprogressbar = O.MiniProgressBar();

        // trigger when  map_pos go out of the screen
        this.edge = O.Edge(
          O.Triggers.Scroll().less('map_pos').offset(0),
          O.Triggers.Scroll().greater('map_pos').offset(0)
        )
      },

      update: function(actions) {
        this.story.clear();

        if (this.baseurl && (this.baseurl !== actions.global.baseurl)) {
          this.baseurl = actions.global.baseurl || 'http://0.'+ basemap +'/{z}/{x}/{y}.png';

          this.basemap.setUrl(this.baseurl);
        }

        // update footer title and author
        var title_ = actions.global.title === undefined ? '' : actions.global.title,
            author_ = actions.global.author === undefined ? 'Using' : 'By '+actions.global.author+' using';

        document.getElementById('title').innerHTML = title_;
        document.getElementById('author').innerHTML = author_;
        document.title = title_ + " | " + author_ +' Odyssey.js';

        var TRIGGER_LINE = this.map.getSize().y + 50;
        this.story.addEvent(
          this.edge,
          O.Parallel(
            O.Actions.CSS($('#map_container')).toggleClass('attachTop'),
            O.Actions.CSS($('#content')).toggleClass('attachMap'),
            O.Actions.Debug().log('attach')
          )
        )

        // create content
        var content = '';

        var slide_ = actions[0];
        $('#header').html(slide_.html());

        this.story
          .addState(
            O.Scroll().within($('#header')),
            slide_(this)
          );

        for(var i = 1; i < actions.length; ++i) {
          var slide = actions[i];
          content += "<div id='s_" + i +"'>" + slide.html() + "</div>";
        }

        $('#content').html(content);

        // first slide is the header, skip it
        for(var i = 1; i < actions.length; ++i) {
          var slide = actions[i];
          this.story.addState(
            O.Triggers.Scroll().within('s_' + i).offset(TRIGGER_LINE),
            O.Parallel(
              slide(this),
              this.miniprogressbar.percent(100*i/(actions.length - 1))
            )
          )
        }

        if(window.scrollY === 0) {
          this.story.go(0);
        }
      }
    });



// O.Template({
//   init: function() {
//     var seq = O.Triggers.Sequential();
// 
//     var baseurl = this.baseurl = 'http://{s}.' + basemap + '/{z}/{x}/{y}.png';
//     var map = this.map = L.map('map').setView([0, 0.0], 4);
//     var basemap = this.basemap = L.tileLayer(baseurl, {
//       attribution: 'data OSM - map CartoDB'
//     }).addTo(map);
// 
//     // enanle keys to move
//     O.Keys().on('map').left().then(seq.prev, seq)
//     O.Keys().on('map').right().then(seq.next, seq)
// 
//     click(document.querySelectorAll('.next')).then(seq.next, seq)
//     click(document.querySelectorAll('.prev')).then(seq.prev, seq)
// 
//     var slides = O.Actions.Slides('slides');
//     var story = O.Story()
// 
//     this.story = story;
//     this.seq = seq;
//     this.slides = slides;
//     this.progress = O.UI.DotProgress('dots').count(0);
//   },
// 
//   update: function(actions) {
//     if (!actions.length) return;
// 
//     this.story.clear();
// 
//     if (this.baseurl && (this.baseurl !== actions.global.baseurl)) {
//       this.baseurl = actions.global.baseurl || 'http://0.' + basemap + '/{z}/{x}/{y}.png';
// 
//       this.basemap.setUrl(this.baseurl);
//     }
// 
//     // update footer title and author
//     var title_ = actions.global.title === undefined ? '' : actions.global.title,
//         author_ = actions.global.author === undefined ? 'Using' : 'By '+actions.global.author+' using';
// 
//     document.getElementById('title').innerHTML = title_;
//     document.getElementById('author').innerHTML = author_;
//     document.title = title_ + " | " + author_ +' Odyssey.js';
// 
//     var sl = actions;
// 
//     document.getElementById('slides').innerHTML = ''
//     this.progress.count(sl.length);
// 
//     // create new story
//     for(var i = 0; i < sl.length; ++i) {
//       var slide = sl[i];
//       var tmpl = "<div class='slide' style='diplay:none'>";
// 
//       tmpl += slide.html();
//       tmpl += "</div>";
//       document.getElementById('slides').innerHTML += tmpl;
// 
//       this.progress.step(i).then(this.seq.step(i), this.seq)
// 
//       var actions = O.Parallel(
//         this.slides.activate(i),
//         slide(this),
//         this.progress.activate(i),
//         resizeAction
//       );
// 
//       actions.on("finish.app", function() {
//         adjustSlides();
//       });
// 
//       this.story.addState(
//         this.seq.step(i),
//         actions
//       )
//     }
// 
//     this.story.go(this.seq.current());
//   },
// 
//   changeSlide: function(n) {
//     this.seq.current(n);
//   }
// });