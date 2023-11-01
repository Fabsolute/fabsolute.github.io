class GameContainer {
    constructor(canvas, width, height, snakeSize) {
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this.snakeSize = snakeSize;
        this.initializeCanvas();
        this.children = [];
        this.time = Date.now();
        this.run = this.run.bind(this);
        this.initializeEvents();
        this.keys = {};
        this.setFrameRate(60);
    }

    initializeCanvas() {
        this.gardenWidth = this.width / this.snakeSize;
        this.gardenHeight = this.height / this.snakeSize;
        this.canvas.setAttribute('width', this.width);
        this.canvas.setAttribute('height', this.height);
        this.context = this.canvas.getContext('2d');
    }

    run() {
        this.update();
        requestAnimationFrame(this.run);
        const dt = (Date.now() - this.time) / 1000;
        if (dt > this.requiredDT) {
            this.time = Date.now();
            this.deltaUpdate();
            this.postDeltaUpdate();
        }

        this.draw();
    }

    setFrameRate(rate) {
        this.requiredDT = 1 / rate;
    }

    add(child) {
        child.setParent(this);
        this.children.push(child);

        return child;
    }

    draw() {
        for (const child of this.children) {
            child.draw?.(this.context);
        }
    }

    update() {
        for (const child of this.children) {
            child.update?.();
        }
    }

    deltaUpdate() {
        for (const child of this.children) {
            child.deltaUpdate?.();
        }
    }

    postDeltaUpdate() {
        for (const child of this.children) {
            child.postDeltaUpdate?.();
        }
    }

    initializeEvents() {
        window.addEventListener('keydown', event => {
            this.keys[event.key] = true;
        });

        window.addEventListener('keyup', event => {
            this.keys[event.key] = false;
        });
    }
}

class Element {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    setParent(parent) {
        this.parent = parent;
    }

    keyPressed(keyName) {
        return this.parent.keys[keyName] ?? false;
    }
}

class Background extends Element {
    draw(context) {
        context.beginPath();
        context.fillStyle = "aliceblue";
        context.rect(this.x, this.y, this.parent.width, this.parent.height);
        context.fill();
    }
}

class RectElement extends Element {
    constructor(x = 0, y = 0, color = 29, saturation = 70, radius = 0) {
        super(x, y);
        this.color = color;
        this.saturation = saturation;
        this.radius = radius;
    }

    draw(context) {
        context.beginPath();
        context.strokeWidth = 4;
        context.strokeStyle = `hsl(${this.color}, ${this.saturation}%, 38%)`
        context.fillStyle = `hsl(${this.color}, ${this.saturation}%, 49%)`;
        context.roundRect(this.x, this.y, this.parent.snakeSize, this.parent.snakeSize, this.radius);
        context.fill();
        context.stroke();
    }

    collided(x, y, width, height) {
        if (x + width <= this.x) {
            return false;
        }

        if (x >= this.x + this.parent.snakeSize) {
            return false;
        }
        if (y + height <= this.y) {
            return false;
        }

        if (y >= this.y + this.parent.snakeSize) {
            return false;
        }

        return true;
    }
}

class SnakeBody extends RectElement {
    constructor(x = 0, y = 0, saturation = 70, radius = 12) {
        super(x, y, 29, saturation, radius);
        this.isDead = false;
    }

    die() {
        this.saturation = -65;
        this.isDead = true;
        if (this.child) {
            this.child.die();
        }
    }

    setParent(parent) {
        super.setParent(parent);

        this.nextX = parent.x;
        this.nextY = parent.y;
    }

    add(body) {
        this.parent.add(body);
        let parent = this;
        while (parent.child != null) {
            parent = parent.child;
        }

        body.setParent(parent);
        parent.child = body;

        return this;
    }

    deltaUpdate() {
        if (this.isDead) {
            return;
        }

        this.x = this.nextX;
        this.y = this.nextY;
        this.nextX = this.parent.x;
        this.nextY = this.parent.y;
    }

    get snakeSize() {
        return this.parent.snakeSize;
    }
}

class Snake extends SnakeBody {
    constructor(x = 0, y = 0, direction = 'right') {
        super(x, y, 100);
        this.direction = direction;
    }

    deltaUpdate() {
        if (this.isDead) {
            return;
        }

        this.radius = [
            this.direction === 'down' || this.direction === 'right' ? 12 : 0,
            this.direction === 'left' || this.direction === 'down' ? 12 : 0,
            this.direction === 'up' || this.direction === 'left' ? 12 : 0,
            this.direction === 'up' || this.direction === 'right' ? 12 : 0
        ];

        const {x, y} = this.calculatePositionChange();
        this.x += x;
        this.y += y;
        this.lastDirection = this.direction;
    }

    update() {
        if (this.lastDirection === 'up' || this.lastDirection === 'down') {
            if (this.keyPressed('ArrowLeft')) {
                this.direction = 'left';
                return;
            }

            if (this.keyPressed('ArrowRight')) {
                this.direction = 'right';
                return;
            }
        }

        if (this.lastDirection !== 'left' && this.lastDirection !== 'right') {
            return;
        }

        if (this.keyPressed('ArrowUp')) {
            this.direction = 'up';
            return;
        }

        if (this.keyPressed('ArrowDown')) {
            this.direction = 'down';
            return;
        }
    }

    calculatePositionChange() {
        const multiplier = this.direction === 'right' || this.direction === 'down' ? 1 : -1;
        if (this.direction === 'right' || this.direction === 'left') {
            return {x: this.parent.snakeSize * multiplier, y: 0};
        }

        return {x: 0, y: this.parent.snakeSize * multiplier};
    }
}

class Food extends RectElement {
    constructor(x = 0, y = 0) {
        super(x, y, 313, 100);
    }
}

class Controller extends Element {
    constructor(snake) {
        super();
        this.snake = snake;
    }

    add(food) {
        this.food = food;
        this.parent.add(food);
        this.spawn();

        return food;
    }

    spawn() {
        this.food.x = Math.floor(this.parent.gardenWidth * Math.random()) * this.parent.snakeSize;
        this.food.y = Math.floor(this.parent.gardenHeight * Math.random()) * this.parent.snakeSize;
    }

    postDeltaUpdate() {
        let child = this.snake.child;
        while (child != null) {
            if (this.snake.collided(child.x, child.y, this.parent.snakeSize, this.parent.snakeSize)) {
                this.snake.die();
                return;
            }

            child = child.child;
        }
        if (this.snake.collided(-this.parent.snakeSize, 0, this.parent.snakeSize, this.parent.height)) {
            this.snake.die();
            return;
        }
        if (this.snake.collided(this.parent.width, 0, this.parent.snakeSize, this.parent.height)) {
            this.snake.die();
            return;
        }
        if (this.snake.collided(0, -this.parent.snakeSize, this.parent.width, this.parent.snakeSize)) {
            this.snake.die();
            return;
        }
        if (this.snake.collided(0, this.parent.height, this.parent.width, this.parent.snakeSize)) {
            this.snake.die();
            return;
        }

        if (this.snake.collided(this.food.x, this.food.y, this.parent.snakeSize, this.parent.snakeSize)) {
            this.snake.add(new SnakeBody(this.food.x, this.food.y));
            this.spawn();
        }
    }
}

const SNAKE_SIZE = 32;
const container = new GameContainer(document.getElementById('root'), 960, 960, 32);
container.setFrameRate(8);
container.add(new Background());

const snake = container.add(new Snake(SNAKE_SIZE * 2));
snake.add(new SnakeBody(SNAKE_SIZE))
    .add(new SnakeBody());

container.add(new Controller(snake))
    .add(new Food());

container.run();
