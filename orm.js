class GameContainer {
    constructor(width, height, snakeSize) {
        this.width = width;
        this.height = height;
        this.snakeSize = snakeSize;
        this.children = [];
        this.time = Date.now();
        this.run = this.run.bind(this);
        this.keys = {};
        this.setFrameRate(60);
        this.gardenWidth = this.width / this.snakeSize;
        this.gardenHeight = this.height / this.snakeSize;
    }

    initialize(engine) {
        this.engine = engine;
        this.engine.setWidth(this.width);
        this.engine.setHeight(this.height);
        this.engine.setRunner(this.run);
        this.initializeEvents();

        this.engine.start();
    }

    run() {
        this.update();
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
            child.draw?.(this.engine);
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
        this.engine.onKeyDown((key) => {
            this.keys[key] = true;
        });

        this.engine.onKeyUp((key) => {
            this.keys[key] = false;
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
    draw(engine) {
        engine.drawRect(this.x, this.y, this.parent.width, this.parent.height, {
            color: "aliceblue",
        });
    }
}

class RectElement extends Element {
    constructor(x = 0, y = 0, color = 29, saturation = 70, radius = 0) {
        super(x, y);
        this.color = color;
        this.saturation = saturation;
        this.radius = radius;
    }

    draw(engine) {
        engine.drawRect(
            this.x,
            this.y,
            this.parent.snakeSize,
            this.parent.snakeSize,
            {
                stroke: {
                    width: 4,
                    color: `hsl(${this.color}, ${this.saturation}%, 38%)`,
                },
                color: `hsl(${this.color}, ${this.saturation}%, 49%)`,
                radius: this.radius,
            },
        );
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
            if (this.keyPressed('left')) {
                this.direction = 'left';
                return;
            }

            if (this.keyPressed('right')) {
                this.direction = 'right';
                return;
            }
        }

        if (this.lastDirection !== 'left' && this.lastDirection !== 'right') {
            return;
        }

        if (this.keyPressed('up')) {
            this.direction = 'up';
            return;
        }

        if (this.keyPressed('down')) {
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
        if (this.snake.isDead) {
            return;
        }

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

class Engine {
    onNextFrame(fn) {
        throw new Error('not implemented');
    }

    setWidth(width) {
        this.width = width;
    }

    setHeight(height) {
        this.height = height;
    }

    setRunner(runner) {
        this.runner = runner;
    }

    onKeyDown(fn) {
        this.onKeyDownCallback = fn;
    }

    onKeyUp(fn) {
        this.onKeyUpCallback = fn;
    }

    start() {
        this.run = this.run.bind(this);
        this.run();
    }

    run() {
        this.runner();

        this.onNextFrame(this.run);
    }
}
