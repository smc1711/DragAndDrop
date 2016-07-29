/**
 * Drag and drop utility. TODO - write collision/obstacle handling
 * 
 * ( just an experiment ) 
 * 
 * @param parent - parent container inside which all the draggables and droppables exist.
 * 
 */
dnd = function(parent) {

    /**
     * Default settings for this element.
     */
    var settings = {

    /* Enables this class whenever element is dragged over. */
    dragOverClass : 'active',

    /* class added when dropped.  */
    dropClass : 'dropped',

    /* Clones all draggables. */
    clone : true,

    /* tolerance - 1 - touch , 2 - 50% inside, 3 - 100% inside. */
    tolerance : 1,

    /* Droppables only trigger if drag or its children has this class. */
    acceptClass : null

    };

    /* list of draggables and their callbacks. */
    var draggables = {};

    /* List of droppables and their callbacks.*/
    var droppables = {};

    /* Current element being dragged. */
    var curDragEl = "", dragOriginal = "";

    /* Current position of the dragged element. */
    var dragCurPos = {top : 0, left : 0};

    /* Initial position of the dragged element.*/
    var dragInitPos = {top : 0, left : 0};

    /* List of elements over which the drag element is being dragged over.  */
    var curDragOverEls = new function() {

        // List of elements over which the draggable is currently dragging.
        // map - Elements mapped with their droppable classes. Looks like -
        //   {
        //       "drop-class-1" : [[html element], [html element], [html element]],
        //       "drop-class-2" : [[html element], [html element], [html element]],
        //       "drop-class-3" : [[html element], [html element], [html element]],
        //   }
        var elements = {};

        /**
         * [ on Drag Over ] Adds element and its associated droppable class.
         * 
         * @param el The dragged over element.
         * @param className the associated droppable class.
         */
        this.add = function(el, className) {

            var i = -1;

            // if droppable classname is empty, initialize. 
            if (!elements[className]) elements[className] = [];

            for (var j = 0, len = elements[className].length; j < len; j++) {
                if (elements[className][j] === el) {
                    i = j;
                    break;
                }
            }

            // if element not already in the list add it.
            if (i === -1) {

                // Apply the dragOver class to highlight the dragged over element.
                if (settings.dragOverClass) el.classList.add(settings.dragOverClass);

                if (!elements[className]) elements[className] = [];
                elements[className].push(el);
            }

            // invoke dropover if any.
            if (droppables[className]["dropover"]) {
                droppables[className]["dropover"].forEach(function(callback) {
                    var o = {};
                    o.droppables = elements[className];
                    o.draggable = dragOriginal;
                    o.clone = curDragEl;

                    callback(o);
                });
            }
        };

        /**
         * [ on Drag Out ] Removes the element from the list once the drag element drags
         * out.
         * 
         * @param el The element to be removed from the list.
         */
        this.remove = function(el) {

            Object.keys(elements).forEach(function(className) {

                var i = elements[className].length;
                while (i--) {
                    if (elements[className][i] === el) {
                        elements[className][i].classList.remove(settings.dragOverClass);
                        elements[className].splice(i, 1);

                        // invoke dropout if any.
                        if (droppables[className]["dropout"]) {
                            droppables[className]["dropout"].forEach(function(callback) {
                                var o = {};
                                o.droppables = el;
                                o.draggable = dragOriginal;
                                o.clone = curDragEl;
                                callback(o);
                            });
                        }
                    }
                }
            });
        };

        /**
         * [ on Drop ] Applies the dropped class and invokes the drop callback returning
         * list of dropped elements.
         */
        this.setDropped = function() {

            Object.keys(elements).forEach(function(className) {

                if (elements[className].length > 0) {

                    if (settings.dropClass) {
                        elements[className].forEach(function(el) {

                            // Apply drop class.
                            el.classList.add(settings.dropClass);
                        });
                    }

                    // invoke drop if any.
                    if (droppables[className]["drop"]) {
                        droppables[className]["drop"].forEach(function(callback) {
                            var o = {};
                            o.droppables = elements[className];
                            o.draggable = dragOriginal;
                            o.clone = curDragEl;
                            callback(o);
                        });
                    }
                }

            });

        };

        /**
         * Empty the contents of elements.
         */
        this.empty = function() {
            elements = {};
        };

    };

    /**
     * The initializer for this intance of dnd.
     */
    (function initParent() {

        parent.addEventListener("mousedown", function(e) {

            document.addEventListener("mouseup", _onMouseUp);

            var target = e.target;
            var i = target.classList.length;

            while (i--) {
                if (draggables.hasOwnProperty(target.classList[i])) {
                    dragstart(e);
                    break;
                }
            }
        });

    })();

    /**
     * Adds mouse move listener to the document.
     */
    function _addMouseMoveToDocument() {
        document.addEventListener("mousemove", _onMouseMove);
    };

    /**
     * Removes mouse move listener from the document.
     */
    function _removeMouseMoveFromDocument() {
        document.removeEventListener("mousemove", _onMouseMove);
    };

    /**
     * on mouse move wrt document.
     * 
     * @param e the mousemove event.
     */
    function _onMouseMove(e) {
        dragover(e);
        drag(e);
    };

    /**
     * On mouse up wrt the document.
     * 
     * @param e the mouseup event.
     */
    function _onMouseUp(e) {

        // make the dragged over elements as dropped.
        curDragOverEls.setDropped();

        // if using helper clone then remove it from dom.
        if (settings.clone) {
            if (curDragEl) parent.removeChild(curDragEl);
        }

        // nullify current dragged element.
        if (curDragEl) curDragEl = "";

        // nullify currently dragged element's original.
        if (dragOriginal) dragOriginal = "";

        // empty the dragged over elements.
        curDragOverEls.empty();

        // remove mousemove listener from document.
        _removeMouseMoveFromDocument();

        // remove mouseup listener.
        document.addEventListener("mouseup", _onMouseUp);
    };

    /**
     * On start of element drag.
     * 
     * @param e The dragstart event.
     */
    function dragstart(e) {

        _addMouseMoveToDocument();

        if (curDragEl) parent.removeChild(curDragEl);

        dragOriginal = e.target;
        curDragEl = e.target;

        // if clone then made the cloned element absolute and place at thesame position
        // as the original.
        if (settings.clone) {
            curDragEl = e.target.cloneNode();
            curDragEl.style.top = getOffsetTop(e.target) + "px";
            curDragEl.style.left = getOffsetLeft(e.target) + "px";
            parent.appendChild(curDragEl);
            curDragEl.style.position = "absolute";
        }
        else {
            curDragEl.style.position = "relative";
        }

        curDragEl.classList.add("dragging");

        // Get cur position rel to parent. 
        var cTop = +curDragEl.style.top.replace("px", "");
        var cLeft = +curDragEl.style.left.replace("px", "");
        dragCurPos.top = cTop ? cTop : 0;
        dragCurPos.left = cLeft ? cLeft : 0;

        // Get initial position relative to page.
        dragInitPos.top = e.pageY;
        dragInitPos.left = e.pageX;

        // invoke dragstart callback if any.
        Object.keys(draggables).forEach(function(className) {
            if (curDragEl.classList.contains(className)) {

                if (draggables[className]["dragstart"]) {
                    draggables[className]["dragstart"].forEach(function(callback) {
                        callback(e);
                    });
                }
            }
        });

    };

    /**
     * On element drag.
     * 
     * @param e The drag event.
     */
    function drag(e) {

        if (curDragEl) {

            curDragEl.style.top = dragCurPos.top + (e.pageY - dragInitPos.top) + "px";
            curDragEl.style.left = dragCurPos.left + (e.pageX - dragInitPos.left) + "px";
        }

        // invoke drag callback if any.
        Object.keys(draggables).forEach(function(className) {
            if (curDragEl.classList.contains(className)) {
                if (draggables[className]["drag"]) {
                    draggables[className]["drag"].forEach(function(callback) {
                        callback(e);
                    });
                }
            }
        });
    };

    /**
     * On drag over of element .
     * 
     * @param e The dragover event.
     */
    function dragover(e) {

        // Get bounding rect of the draggable.
        var tRect = undefined;
        if (settings.acceptClass && !curDragEl.classList.contains(settings.acceptClass)) {

            // search for accept class among its children.
            var acceptEl = curDragEl.querySelector("." + settings.acceptClass);
            if (acceptEl) {
                tRect = acceptEl.getBoundingClientRect();
            }
            // if accept class not found then return.
            else {
                return;
            }
        }
        else {
            tRect = curDragEl.getBoundingClientRect();
        }

        var classes = Object.keys(droppables);

        classes.forEach(function(className) {

            // Get list of droppables.
            var elements = parent.getElementsByClassName(className);

            // Check if draggable and droppable intersect. 
            for (var i = 0, len = elements.length; i < len; i++) {

                // Get bounding rect of the droppable. 
                var eRect = elements[i].getBoundingClientRect();

                // if they intersect
                if (tRect.left < eRect.right && tRect.right > eRect.left &&
                    tRect.top < eRect.bottom && tRect.bottom > eRect.top) {

                    // If tolerance is 2 then check if they intersect at least 50%
                    if (settings.tolerance === 2) {
                        if (getAreaMatchPercentage(tRect, eRect) >= 50) {

                            curDragOverEls.add(elements[i], className);
                        }
                        else {
                            curDragOverEls.remove(elements[i]);
                        }
                    }
                    // If tolerance is 3 then check if they intersect at least 100%
                    else if (settings.tolerance === 3) {

                        if (getAreaMatchPercentage(tRect, eRect) >= 100) {
                            curDragOverEls.add(elements[i], className);
                        }
                        else {
                            curDragOverEls.remove(elements[i]);
                        }
                    }

                    // Else if tolerance is 1 .i.e. elements just touch, then just add it 
                    // to list of drag over elements. 
                    else {
                        curDragOverEls.add(elements[i], className);
                    }
                }

                // If they dont intersect then remove it from list of dragged over 
                // elements if its there/
                else {
                    curDragOverEls.remove(elements[i]);
                }
            }
        });
    };

    /**
     * Gets the insersection area percentage.
     * 
     * @param tRect the draggable boundaries.
     * @param eRect the droppable boundaries.
     * @returns {Number} the area percentage.
     */
    function getAreaMatchPercentage(tRect, eRect) {

        // height of intersecting area.
        var t = Math.max(tRect.top, eRect.top);

        var b = Math.min(tRect.bottom, eRect.bottom);

        var h = t - b;

        // width of intersecting area. 
        var l = Math.max(tRect.left, eRect.left);

        var r = Math.min(tRect.right, eRect.right);

        var w = l - r;

        // return area percentage wrt to the draggable area. 
        return Math.abs((h * w) / (tRect.height * tRect.width)) * 100;
    };

    /**
     * Gets offset top of element wrt 'parent' ( parameter parent).
     * 
     * @param elem
     * @returns {Number}
     */
    function getOffsetTop(elem) {
        var offsetTop = 0;
        do {
            if (!isNaN(elem.offsetTop)) {
                offsetTop += elem.offsetTop;
            }
        }
        while ((elem = elem.offsetParent) && elem != parent);
        return offsetTop;
    };

    /**
     * Gets offset left of element wrt 'parent' ( parameter parent).
     * 
     * @param elem
     * @returns {Number}
     */
    function getOffsetLeft(elem) {
        var offsetLeft = 0;
        do {
            if (!isNaN(elem.offsetLeft)) {
                offsetLeft += elem.offsetLeft;
            }
        }
        while ((elem = elem.offsetParent) && elem != parent);
        return offsetLeft;
    };

    /**
     * Add a draggable event to el.
     * 
     * @param eventType The type of drag event string.
     * @param element the element whose event needs to be observed - either element obj or
     * classname/id.
     * @param callback the callback to be fired when the event is triggered.
     */
    this.on = function(eventType, element, callback) {

        var type = '';

        if (["dragstart", "drag"].indexOf(eventType) >= 0) {
            type = draggables;
        }
        else if (["drop", "dropover", "dropout"].indexOf(eventType) >= 0) {
            type = droppables;
        }

        if (!type[element]) {
            type[element] = {};
        }

        if (!type[element][eventType]) {
            type[element][eventType] = [];
        }

        if (callback) {
            type[element][eventType].push(callback);
        }

    };

    /**
     * Settings.
     */
    this.settings = settings;

};
