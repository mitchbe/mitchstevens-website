'use strict';

class Graph {
	constructor() {
		this._radius          = 0;
		this._stripCoords     = []; 
		this._degPerIncrement = 0;
		this._stripStart      = 0;
		this._stripSize       = 0;
		this._multiplier      = 0;
	}

	// --- Coords
	
	_findCoord(value) {
		const angle = CoreUtil.Math.degToRad(value * this._degPerIncrement);
		return [this._radius * Math.cos(angle), this._radius * Math.sin(angle)]
	}

	_calcStripCoords() {
		this._stripCoords = [];
		for (let i = 0; i < this._stripSize; i++) {
			this._stripCoords[i] = this._findCoord(i);
		}
	}
	
	// --- Properties 
	
	set radius(value) {
		this._radius = value;
		this._calcStripCoords();
	}

	set stripSize(value) {
		this._stripSize = value;
		this._degPerIncrement = 360 / value;
		this._calcStripCoords();
	}
	set stripStart(value) { this._stripStart = value; }
	set multiplier(value) { this._multiplier = value; }

	get radius()     { return this._radius;     }
	get stripSize()  { return this._stripSize;  }
	get stripStart() { return this._stripStart; }
	get multiplier() { return this._multiplier; }

	// --- Render 

	drawStripCoords(ctx, cx, cy) {
		for (let i = 0; i < this._stripCoords.length; i++) {
			ctx.rect(cx + this._stripCoords[i][0], cy + this._stripCoords[i][1], 1, 1);
			ctx.stroke();
		}
	}

	draw(ctx, cx, cy) {
		for (let i = 0; i < this._stripCoords.length; i++) {
			ctx.beginPath();
			ctx.moveTo(cx + this._stripCoords[i][0], cy + this._stripCoords[i][1]);
			const dest = this._findCoord((i + this._stripStart) * this._multiplier);
			ctx.lineTo(cx + dest[0], cy + dest[1]);
			ctx.stroke();
		}
	}
}


const GraphWindow = (function() {
	var stack = 10;

	return class {
	/* Not supported in older browsers...
		_el; _els = {};
		_graph;
		_ctx;
		_stripStart; _stripStartVector;
		_stripSize; _stripSizeVector;
		_multiplier; _multiplierVector;
		_size; _colour;
		_closeEventHandlers = [];*/

		constructor(stripStart, stripSize, multiplier, radius,
					stripStartVector, stripSizeVector, multiplierVector, radiusVector,
					size, colour) {
			this._els = {};
			this._closeEventHandlers = [];

			this._findElements();
			this._ctx             = this._els.canvas.getContext("2d");
			this._graph     	  = new Graph();
			this._bindElementsEvents();
			this.stripStart 	  = stripStart;
			this.stripSize  	  = stripSize;
			this.multiplier 	  = multiplier; 
			this.radius 	      = radius;
			this.stripStartVector = stripStartVector;
			this.stripSizeVector  = stripSizeVector;
			this.multiplierVector = multiplierVector;
			this.radiusVector     = radiusVector;
			this.size   		  = size;
			this.colour 		  = colour;
			this.render();
		}

		_findElements() {
			this._el = document.querySelector("#graph-template").content.cloneNode(true).querySelector("div.window");
			this._els = {
				canvas 			   : this._el.querySelector("canvas.graph"),
				hideBtn			   : this._el.querySelector(".hide-btn"),
				closeBtn		   : this._el.querySelector(".close-btn"),
				controls           : this._el.querySelector(".graph-config"),
				stripStartEl       : this._el.querySelector("input.strip-start"),
				stripSizeEl        : this._el.querySelector("input.strip-size"),
				multiplierEl       : this._el.querySelector("input.multiplier"),
				radiusEl           : this._el.querySelector("input.radius"),
				stripStartVectorEl : this._el.querySelector("input.strip-start-vector"),
				stripSizeVectorEl  : this._el.querySelector("input.strip-size-vector"),
				multiplierVectorEl : this._el.querySelector("input.multiplier-vector"),
				radiusVectorEl     : this._el.querySelector("input.radius-vector"),
				sizeEl	     	   : this._el.querySelector("select.size"),
				colourEl           : this._el.querySelector("select.colour")
			};
		}

		_bindElementsEvents() {
			this._els.stripStartEl.addEventListener("change", e => { this.stripStart = parseInt(e.target.value);   this.render(); });
			this._els.stripSizeEl .addEventListener("change", e => { this.stripSize  = parseInt(e.target.value);   this.render(); }); 
			this._els.multiplierEl.addEventListener("change", e => { this.multiplier = parseFloat(e.target.value); this.render(); });
			this._els.radiusEl    .addEventListener("change", e => { this.radius     = parseFloat(e.target.value);   this.render(); });
			this._els.stripStartVectorEl.addEventListener("change", e => this.stripStartVector = parseInt(e.target.value));
			this._els.stripSizeVectorEl .addEventListener("change", e => this.stripSizeVector  = parseInt(e.target.value));
			this._els.multiplierVectorEl.addEventListener("change", e => this.multiplierVector = parseFloat(e.target.value));
			this._els.radiusVectorEl    .addEventListener("change", e => this.radiusVector     = parseFloat(e.target.value));
			this._els.sizeEl  .addEventListener("change", e => { this.size   = parseInt(e.target.value); this.radius = this._size >> 1; this.render(); });
			this._els.colourEl.addEventListener("change", e => { this.colour = e.target.value; 			 this.render(); });
			this._els.canvas.addEventListener("dblclick", e => this.toggleControlsVisible());
			this._els.hideBtn.addEventListener("click", e => {
				this.hideControls();
				e.stopPropagation();
			});
			this._els.closeBtn.addEventListener("click", e => this._closeEventHandlers.forEach(h => h()));
			this._makeDraggable();
		}

		_makeDraggable() {
			CoreUtil.Html.enableDragEvents(this._els.canvas);
			this._els.canvas.addEventListener("drag", d => {
				let top = this._el.offsetTop  + d.detail.diffY;
				if (top < -100) top = -100;
				this._el.style.top  = top + "px";

				let left = this._el.offsetLeft + d.detail.diffX;
				if (left < -100) left = -100;
				this._el.style.left = left + "px";
			});
			this._el.addEventListener("mousedown", e => {
				this._el.style.zIndex = ++stack;
			});
		}

		// --- Position
		
		setPosition(x, y) {
			this._el.style.left  = x + "px";
			this._el.style.top   = y + "px";
		}

		// --- Controls
		
		toggleControlsVisible() {
			if (this._els.controls.style.visibility == "hidden") {
				this._els.controls.style.visibility = "";	
			} else {
				this._els.controls.style.visibility = "hidden";	
			}
		}

		hideControls() {
			this._els.controls.style.visibility = "hidden";	
		}

		// --- Properties
		
		get el() { return this._el; }

		set stripStart(value) {
			this._graph.stripStart       = value;
			this._els.stripStartEl.value = value;
		}
		get stripStart() { return this._graph.stripStart; }

		set stripSize(value) {
			this._graph.stripSize       = value;
			this._els.stripSizeEl.value = value;
		}
		get stripSize() { return this._graph.stripSize; }

		set multiplier(value) {
			this._graph.multiplier 	     = value; 
			this._els.multiplierEl.value = value.toFixed(2);
		}
		get multiplier() { return this._graph.multiplier; }

		set radius(value) {
			this._graph.radius       = value; 
			this._els.radiusEl.value = value;
		}
		get radius() { return this._graph._radius; }
		
		
		set stripStartVector(value) {
			this._stripStartVector 			   = value;
			this._els.stripStartVectorEl.value = value;
		}
		get stripStartVector() { return this._stripStartVector; }

		set stripSizeVector(value) {
			this._stripSizeVector 			  = value;
			this._els.stripSizeVectorEl.value = value;
		}
		get stripSizeVector() { return this._stripSizeVector; }

		set multiplierVector(value) {
			this._multiplierVector 			   = value;
			this._els.multiplierVectorEl.value = value;
		}
		get multiplierVector() { return this._multiplierVector; }

		set radiusVector(value) {
			this._radiusVector             = value; 
			this._els.radiusVectorEl.value = value;
		}
		get radiusVector() { return this._radiusVector; }


		set size(value) {
			this._size = value;
			this._cx = value >> 1;
			this._cy = this._cx;
			this._els.sizeEl.value  = value;
			this._els.canvas.width  = value;
			this._els.canvas.height = value;
			this.colour = this.colour;
		}
		get size() { return this._size; }

		set colour(value) {
			this._colour             = value;
			this._els.colourEl.value = value;
			this._ctx.strokeStyle    = value;
		}
		get colour() { return this._colour; }

		// --- Events

		onClose(handler) {
			this._closeEventHandlers.push(handler);
		}

		// --- Render
		
		render() {
			this._ctx.clearRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height); 
			this._graph.draw(this._ctx, this._cx, this._cy);
		}

		tick() {
			if (this._stripStartVector != 0) {
				this.stripStart += this._stripStartVector;
			}
			if (this._stripSizeVector != 0) {
				this.stripSize += this._stripSizeVector;
			}
			if (this._multiplierVector != 0) {
				this.multiplier += this._multiplierVector;
			}
			if (this._radiusVector != 0) {
				this.radius += this._radiusVector;
			}
			this.render();
		}
	};
})();
