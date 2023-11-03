class HtmlElementEngine extends Engine {
    constructor(parent) {
        super();
        if (parent == null) {
            parent = document.createElement('div');
            document.body.appendChild(parent);
        }

        this.parent = parent;
        this.elements = {};
    }

    onNextFrame(fn) {
        setTimeout(() => {
            for (const element of Object.values(this.elements)) {
                element.style.display = 'none';
            }
            fn();
        });
    }

    start() {
        this.parent.style.overflow = 'hidden';
        this.parent.style.position = 'relative';
        this.parent.style.width = `${this.width}px`;
        this.parent.style.height = `${this.height}px`;
        window.addEventListener("keydown", (event) => {
            const key = event.key.replaceAll("Arrow", "").toLowerCase();
            this.onKeyDownCallback(key);
        });

        window.addEventListener("keyup", (event) => {
            const key = event.key.replaceAll("Arrow", "").toLowerCase();
            this.onKeyUpCallback(key);
        });

        super.start();
    }

    drawRect(x, y, w, h, opts) {
        const key = `${x}-${y}-${w}-${h}`;
        if (!this.elements[key]) {
            const element = document.createElement('div');
            element.style.width = `${w}px`;
            element.style.height = `${h}px`;
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
            element.style.position = 'absolute';
            this.parent.appendChild(element);

            this.elements[key] = element;
        }

        const element = this.elements[key];
        element.style.display = 'block';

        if (opts.radius) {
            if (Array.isArray(opts.radius)) {
                element.style.borderRadius = opts.radius.map(r => `${r}px`).join(' ');
            } else {
                element.style.borderRadius = `${opts.radius}px`;
            }
        } else {
            element.style.borderRadius = '0';
        }

        if (opts.stroke) {
            element.style.borderWidth = opts.stroke.width;
            element.style.borderColor = opts.stroke.color;
        } else {
            element.style.borderWidth = '0';
        }

        element.style.backgroundColor = opts.color;
    }
}
