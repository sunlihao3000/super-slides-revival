
/*! Superslides - v0.6.3-wip - 2013-12-17
* https://github.com/nicinabox/superslides
* Copyright (c) 2013 Nic Aitch; Licensed MIT */

// window and jquery doc loaded
;(function ( $, window, document, undefined ) {  

    'use strict';
    
    var Superslides ='superslides';
    var plugin = Superslides;

    var defaults = {

        play: false,
        animation_speed: 600,
        animation_easing: 'swing',
        animation: 'slide',
        inherit_width_from: window,
        inherit_height_from: window,
        pagination: true,
        hashchange: false,
        scrollable: true,
        lazingImage: true,
        elements: {
            preserve: '.preserve',
            nav: '.slides-navigation',
            container: '.slides-container',
            pagination: '.slides-pagination',
            slidesContorlClass: 'slides-control'
        }
    };    

    Superslides = function(el, options) {

        var widget = this;

        widget.options = $.extend( true,{}, defaults, options);
        
        var widget_control   = $('<div>', { "class": widget.options.elements.slidesContorlClass});
        
        //console.log(widget_control);
        
        var multiplier = 1;

        widget.widget_element = $(el);
        widget.widget_container = widget.widget_element.find(widget.options.elements.container);

        // Private Methods
        var initialize = function() {

            multiplier = widget.findMultiplier();

            // function: click nav to navigate next slider and prev slider
            // sample
            /* 
            <nav class="slides-navigation">
                <a href="#" class="next">
                    <i class="icon-chevron-right"></i>
                </a>

                <a href="#" class="prev">
                    <i class="icon-chevron-left"></i>
                </a>
            </nav>

            */


            widget.widget_element.on('click', widget.options.elements.nav + " a", function(e) {
                
                e.preventDefault();

                // stop the animate first then re-start it
                widget.stop();

                if ($(this).hasClass('next')) {
                    // animate 
                    // direction is next,
                    // call back is function widget startf 
                    widget.animate('next', function() {
                        widget.start();
                    });
                } else {
                    widget.animate('prev', function() {
                        widget.start();
                    });
                }

            });

            // navi on keyboard
            $('body').on('keyup', function(e) {
                if (e.keyCode === 37) {
                    widget.animate('prev');
                }
                if (e.keyCode === 39) {
                    widget.animate('next');
                }
            });

            //
            $(window).on('resize', function() {
                
                setTimeout(function() {
                    
                    var widget_container_children = widget.widget_container.children();

                    widget.width  = widget.findWidth();
                    widget.height = widget.findHeight();

                    widget_container_children.css({
                        width: widget.width,
                        left: widget.width
                    });

                    widget.css.containers();
                    widget.css.images();
                }, 10);
            });

            if (widget.options.hashchange) {
                $(window).on('hashchange', function() {
                    var hash = widget.parseHash();
                    var index;

                    index = widget.upcomingSlide(hash);

                    if (index >= 0 && index !== widget.current) {
                        widget.animate(index);
                    }
                });
            }

            widget.pagination.events();

            widget.start();
            return widget;
        };

        var css = {
            containers: function() {
                if (widget.init) {
                    widget.widget_element.css({
                        height: widget.height
                    });

                    widget.widget_control.css({
                        width: widget.width * multiplier,
                        left: -widget.width
                    });

                    widget.widget_container.css({

                    });
                } else {
                    $('body').css({
                        margin: 0
                    });

                    widget.widget_element.css({
                        position: 'relative',
                        overflow: 'hidden',
                        width: '100%',
                        height: widget.height
                    });

                    widget.widget_control.css({
                        position: 'relative',
                        transform: 'translate3d(0)',
                        height: '100%',
                        width: widget.width * multiplier,
                        left: -widget.width
                    });

                    widget.widget_container.css({
                        display: 'none',
                        margin: '0',
                        padding: '0',
                        listStyle: 'none',
                        position: 'relative',
                        height: '100%'
                    });
                }

                if (widget.size() === 1) {
                    widget.widget_element.find(widget.options.elements.nav).hide();
                }
            },
            images: function() {

                var $images = widget.widget_container.find('img')
                .not(widget.options.elements.preserve);

                $images.removeAttr('width').removeAttr('height')
                .addClass('ss-image');

                $images.each(function() {
                    var image_aspect_ratio = widget.image.aspectRatio(this);
                    var image = this;

                    if (!$.data(this, 'processed')) {
                        var img = new Image();
                        img.onload = function() {
                            widget.image.fn_scale(image, image_aspect_ratio);
                            widget.image.center(image, image_aspect_ratio);
                            $.data(image, 'processed', true);
                        };
                        img.src = this.src;

                    } else {
                        widget.image.fn_scale(image, image_aspect_ratio);
                        widget.image.center(image, image_aspect_ratio);
                    }
                });
            },
            children: function() {
                var widget_container_children = widget.widget_container.children();

                if (widget_container_children.is('img')) {
                    widget_container_children.each(function() {
                        if ($(this).is('img')) {
                            $(this).wrap('<div>');

                            // move id attribute
                            var id = $(this).attr('id');
                            $(this).removeAttr('id');
                            $(this).parent().attr('id', id);
                            }
                            });

                    widget_container_children = widget.widget_container.children();
                }

                if (!widget.init) {
                    widget_container_children.css({
                        display: 'none',
                        left: widget.width * 2
                    });
                }

                widget_container_children.css({
                    position: 'absolute',
                    overflow: 'hidden',
                    height: '100%',
                    width: widget.width,
                    top: 0,
                    zIndex: 0
                });

            }
        };

        var fx = {
            slide: function(orientation, complete) {
                var widget_container_children = widget.widget_container.children();
                var $target   = widget_container_children.eq(orientation.upcoming_slide);

                $target.css({
                    left: orientation.upcoming_position,
                    display: 'block'
                });

                widget.widget_control.animate({
                    left: orientation.offset
                },
                widget.options.animation_speed,
                widget.options.animation_easing,
                function() {
                    if (widget.size() > 1) {
                        widget.widget_control.css({
                            left: -widget.width
                        });

                        widget_container_children.eq(orientation.upcoming_slide).css({
                            left: widget.width,
                            zIndex: 2
                        });

                        if (orientation.outgoing_slide >= 0) {
                            widget_container_children.eq(orientation.outgoing_slide).css({
                                left: widget.width,
                                display: 'none',
                                zIndex: 0
                            });
                        }
                    }

                    complete();
                });
            },
            fade: function(orientation, complete) {
                
                var widget = this,
                
                widget_container_children = widget.widget_container.children(),
                
                // this current side
                $outgoing = widget_container_children.eq(orientation.outgoing_slide),
                
                // next slide
                $target = widget_container_children.eq(orientation.upcoming_slide);

                // the container has style left: -1440px(full width on left)
                // so, the each children in container left:1440px
                // now, targer slide is fading in
                $target.css({
                    left: this.width, //(1440px)
                    opacity: 0,
                    display: 'block'
                }).animate({
                    opacity: 1
                },
                    widget.options.animation_speed,
                    widget.options.animation_easing
                );







                // so the current slide is exist (>= 0)
                // it fade out
                if (orientation.outgoing_slide >= 0) {
                    $outgoing.animate({
                        opacity: 0
                    },
                    widget.options.animation_speed,
                    widget.options.animation_easing,
                    // now the target slide is fade in and current slide is fade out
                    // we need set the zindex 
                    function() {
                        if (widget.size() > 1) {

                            widget_container_children.eq(orientation.upcoming_slide).css({
                                zIndex: 2
                            });

                            if (orientation.outgoing_slide >= 0) {
                                //console.log(orientation.outgoing_slide ); //  0,1,2
                                // 
                                widget_container_children.eq(orientation.outgoing_slide).css({
                                    //lihao
                                    //opacity: 1,
                                    display: 'none',
                                    zIndex: 0
                                });
                            }
                        }

                        complete();
                    });
                } else {
                    $target.css({
                        zIndex: 2
                    });
                    complete();
                }
            }
        };

        
        fx = $.extend(fx, $.fn.superslides.fx);

        var image = {
            centerY: function(image) {
                var $img = $(image);

                $img.css({
                    top: (widget.height - $img.height()) / 2
                });
            },
            centerX: function(image) {
                var $img = $(image);

                $img.css({
                    left: (widget.width - $img.width()) / 2
                });
            },
            center: function(image) {
                widget.image.centerX(image);
                widget.image.centerY(image);
            },
            aspectRatio: function(image) {
                if (!image.naturalHeight && !image.naturalWidth) {
                    var img = new Image();
                    img.src = image.src;
                    image.naturalHeight = img.height;
                    image.naturalWidth = img.width;
                }

                return image.naturalHeight / image.naturalWidth;
            },
            fn_scale: function(image, image_aspect_ratio) {
                image_aspect_ratio = image_aspect_ratio || widget.image.aspectRatio(image);

                var container_aspect_ratio = widget.height / widget.width,
                $img = $(image);

                if (container_aspect_ratio > image_aspect_ratio) {
                    $img.css({
                        height: widget.height,
                        width: widget.height / image_aspect_ratio
                    });

                } else {
                    $img.css({
                        height: widget.width * image_aspect_ratio,
                        width: widget.width
                    });
                }
            }
        };

        var pagination = {
            setCurrent: function(i) {
                if (!widget.this_pagination) { return; }

                var this_pagination_children = widget.this_pagination.children();

                this_pagination_children.removeClass('current');
                this_pagination_children.eq(i)
                .addClass('current');
            },
            addItem: function(i) {
                var slide_number = i + 1,
                href = slide_number,
                $slide = widget.widget_container.children().eq(i),
                slide_id = $slide.attr('id');

                if (slide_id) {
                    href = slide_id;
                }

                var $item = $("<a>", {
                    'href': "#" + href,
                    'text': href
                });

                $item.appendTo(widget.this_pagination);
            },
            fn_setup: function() {
                if (!widget.options.pagination || widget.size() === 1) { return; }

                var this_pagination = $("<nav>", {
                    'class': widget.options.elements.pagination.replace(/^\./, '')
                });

                widget.this_pagination = this_pagination.appendTo(widget.widget_element);

                var i;
                for ( i = 0; i < widget.size(); i += 1) {
                    widget.pagination.addItem(i);
                }
            },
            events: function() {
                widget.widget_element.on('click', widget.options.elements.pagination + ' a', function(e) {
                    e.preventDefault();

                    var hash  = widget.parseHash(this.hash), index;
                    index = widget.upcomingSlide(hash, true);

                    if (index !== widget.current) {
                        widget.animate(index, function() {
                            widget.start();
                        });
                    }
                });
            }
        };

        this.css = css;
        this.image = image;
        this.pagination = pagination;
        this.fx = fx;
        this.animation = this.fx[this.options.animation];

        this.widget_control = this.widget_container.wrap(widget_control).parent('.slides-control');

        widget.findPositions();
        widget.width  = widget.findWidth();
        widget.height = widget.findHeight();

        this.css.children();
        this.css.containers();
        this.css.images();
        this.pagination.fn_setup();

        return initialize();

    };
    //

    Superslides.prototype = {

        findWidth: function() {
            return $(this.options.inherit_width_from).width();
        },
        findHeight: function() {
            return $(this.options.inherit_height_from).height();
        },

        findMultiplier: function() {
            return this.size() === 1 ? 1 : 3;
        },

        upcomingSlide: function(direction, from_hash_change) {
            
            if (from_hash_change && !isNaN(direction)) {
                direction = direction - 1;
            }
            /*

            console.log((/next/));
            http://www.w3schools.com/jsref/jsref_regexp_test.asp

            //RegExpObject.test(string)
            // The string:
            var str = "Hello world!";

            // Look for "Hello"
            var patt = /Hello/g;
            var result = patt.test(str);

            so:
            (/next/).test(direction) --- is to test the direction contain the string next

            */
            if ( (/next/).test(direction) ) {
                
                return this.nextInDom();

            } else if ((/prev/).test(direction)) {
                
                return this.prevInDom();

            } else if ((/\d/).test(direction)) {
                
                return +direction;

            } else if (direction && (/\w/).test(direction)) {
                
                var index = this.findSlideById(direction);
                
                if (index >= 0) {
                    return index;
                } else {
                    return 0;
                }

            } else {

                return 0;

            }
        },

        findSlideById: function(id) {
            return this.widget_container.find('#' + id).index();
        },

        findPositions: function(current, thisRef) {
            thisRef = thisRef || this;

            if (current === undefined) {
                current = -1;
            }

            thisRef.current = current;
            thisRef.next    = thisRef.nextInDom();
            thisRef.prev    = thisRef.prevInDom();
        },

        nextInDom: function() {
            var index = this.current + 1;

            if (index === this.size()) {
                index = 0;
            }

            return index;
        },

        prevInDom: function() {
            var index = this.current - 1;

            if (index < 0) {
                index = this.size() - 1;
            }

            return index;
        },

        parseHash: function(hash) {
            hash = hash || window.location.hash;
            hash = hash.replace(/^#/, '');

            if (hash && !isNaN(+hash)) {
                hash = +hash;
            }

            return hash;
        },

        size: function() {
            return this.widget_container.children().length;
        },

        destroy: function() {
            return this.widget_element.removeData();
        },

        update: function() {
            this.css.children();
            this.css.containers();
            this.css.images();

            this.pagination.addItem(this.size());

            this.findPositions(this.current);
            // this code is trigger the event 'updated.slides'
            this.widget_element.trigger('updated.slides');
        },

        stop: function() {
            clearInterval(this.play_id);
            delete this.play_id;
            // this code is trigger the event 'stopped.slides'
            this.widget_element.trigger('stopped.slides');
        },

        start: function() {
            var widget = this;

            if (widget.options.hashchange) {
                $(window).trigger('hashchange');
            } else {
                this.animate();
            }

            if (this.options.play) {
                if (this.play_id) {
                    this.stop();
                }

                this.play_id = setInterval(function() {
                    widget.animate();
                }, this.options.play);
            }
            // this code is trigger the event 'started.slides'
            this.widget_element.trigger('started.slides');
        },

        animate: function(direction, userCallback) {
            
            var widget = this;
            var orientation = {};


            // this animating is exist,
            // return

            //console.log(this.animating);
            // false 

            if (this.animating) {
                //console.log('here');
                return;
            }
            // then give this animating value to true
            this.animating = true;
            //

            // default is to next slide
            if (direction === undefined) {
                direction = 'next';
            }

            // this + next slide in direction
            orientation.upcoming_slide = this.upcomingSlide(direction);

            // if up coming slide is geater then the size of all slides
            // return 
            if (orientation.upcoming_slide >= this.size()) {
                return;
            }

            // if current witdh 1440
            orientation.outgoing_slide    = this.current;

            //orientation.upcoming_position = 2880
            orientation.upcoming_position = this.width * 2;
            
            //orientation.offset = -2880
            orientation.offset            = -orientation.upcoming_position;
            

            if (direction === 'prev' || direction < orientation.outgoing_slide) {
                orientation.upcoming_position = 0;
                orientation.offset            = 0;
            }

            if (widget.size() > 1) {
                widget.pagination.setCurrent(orientation.upcoming_slide);
            }

            if (widget.options.hashchange) {
                var hash = orientation.upcoming_slide + 1,
                id = widget.widget_container.children(':eq(' + orientation.upcoming_slide + ')').attr('id');

                if (id) {
                    window.location.hash = id;
                } else {
                    window.location.hash = hash;
                }
            }

            if (widget.size() === 1) {
                widget.stop();
                widget.options.play = 0;
                widget.options.animation_speed = 0;
                orientation.upcoming_slide    = 0;
                orientation.outgoing_slide    = -1;
            }
            


            //lihao 
            //console.log(widget.widget_element);

            /*
            Superslides triggers a few events that you can bind to.

            started.slides
            init.slides
            animating.slides // Before slide animation begins
            animated.slides  // After slide animation ends
            updated.slides*/

            //console.log([orientation]); 
            
            /*
            [orientation] is
                object:
                offset: -2880
                outgoing_slide : -1
                upcoming_position : 2880
                upcoming_slide : 0
            */

            // this code is trigger the event 'animating.slides'
            widget.widget_element.trigger('animating.slides', [orientation]);
            //


            widget.animation(orientation, function() {
                
                widget.findPositions(orientation.upcoming_slide, widget);

                if (typeof userCallback === 'function') {
                    userCallback();
                }

                widget.animating = false;
                // this code is trigger the event 'animated.slides'
                widget.widget_element.trigger('animated.slides');

                if (!widget.init) {
                    // this code is trigger the event 'init.slides'
                    widget.widget_element.trigger('init.slides');
                    widget.init = true;
                    widget.widget_container.fadeIn('fast');
                }
            });
        }
    };

    //
    // jQuery plugin definition
    // not need change here

    $.fn[plugin] = function(option, args) {
        var result = [];

        this.each(function() {
            var $this, data, options;

            $this = $(this);
            data = $this.data(plugin);
            options = typeof option === 'object' && option;

            if (!data) {
                data = new Superslides(this, options);
                result = $this.data(plugin, (data));
            }

            if (typeof option === "string") {
                result = data[option];
                if (typeof result === 'function') {

                    result = result.call(data, args);
                    return result;
                }
            }
        });

        return result;
    };

    $.fn[plugin].fx = {};

})( jQuery, window, document );

