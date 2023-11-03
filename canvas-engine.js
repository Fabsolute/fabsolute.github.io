class CanvasEngine extends Engine {
    constructor(canvas) {
        super();
        if (canvas == null) {
            canvas = document.createElement('canvas');
            document.body.appendChild(canvas);
        }

        this.canvas = canvas;
    }

    start() {
        this.canvas.setAttribute("width", this.width);
        this.canvas.setAttribute("height", this.height);
        this.context = this.canvas.getContext("2d");
        window.addEventListener("keydown", (event) => {
            const key = event.key.replaceAll("Arrow", "").toLowerCase();
            this.onKeyDownCallback(key);
        });

        window.addEventListener("keyup", (event) => {
            const key = event.key.replaceAll("Arrow", "").toLowerCase();
            this.onKeyUpCallback(key);
        });

        this.onNextFrame = requestAnimationFrame.bind(null);

        super.start();
    }

    drawRect(x, y, w, h, opts) {
        this.context.beginPath();
        if (opts.radius) {
            this.context.roundRect(x, y, w, h, opts.radius);
        } else {
            this.context.rect(x, y, w, h);
        }

        if (opts.stroke) {
            this.context.strokeWidth = opts.stroke.width;
            this.context.strokeStyle = opts.stroke.color;
            this.context.stroke();
        }

        this.context.fillStyle = opts.color;
        this.context.fill();
    }
}
