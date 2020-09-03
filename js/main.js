var gameMethods = {
    "init": init,
    "preload": preload,
    "create": create,
    "update": update
};
var animationIntervals = {
    "up": 75,
    "down": 75,
    "left": 75,
    "right": 75,
    "fall": 20
};
var animationMovement = {
    "up": [4, 4, 4, 4],
    "down": [4, 4, 4, 4],
    "leftRight": [4, 4, 4, 4],
    "leftRightPizza": [2, 2, 6, 2],
    "fall": [4, 4, 4, 4]
};
var animationFrames = {
    "leftRight": [0, 1, 2, 3],
    "leftRightPizza": [4, 5, 6, 7],
    "down": [8, 9, 10, 11],
    "up": [12, 13, 14, 15],
    "downPizza": [16, 17, 18, 19],
    "upPizza": [20, 21, 22, 23]
};
var ovenFPS = 10;
var customerFPS = 8;
var yolloFPS = 8;
var animationIndex = 0;
var gameId = "papa-joe";
var gameWidth = 256;
var gameHeight = 240;
var bg_music;
var step_1_sfx;
var step_2_sfx;
var oven_sfx;
var pickup_sfx;
var order_up_sfx;
var complaint_sfx;
var score_sfx;
var bgLayer;
var ovenLayer;
var ladderLayer;
var ladderMap;
var floorLayer;
var floorMap;
var ovenMap;
var papajoe;
var pauseMovementUpdate = false;
var canGoU = false;
var canGoD = false;
var canGoL = false;
var canGoR = false;
var grounded = false;
var falling = false;
var hasPizza = false;
var pizzaWalkSFX = 1;
var fallingSfxPlayed = false;
var worldWrap = false;
var ovens;
var ladderGotchaLeftDown = false;
var ladderGotchaRightDown = false;
var ladderGotchaLeftUp = false;
var ladderGotchaRightUp = false;
var ovensData = [];
var customers = [];
var lastYolo;
var orderIntervals = {
    woman: {
        req: 12000,
        wait: 8000    
    },
    factory: {
        req: 5000,
        wait: 12000
    }
}

var game = new Phaser.Game(gameWidth, gameHeight, Phaser.CANVAS, gameId, gameMethods, false, true);

function init() {
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(game.canvas);
}

function preload() {
    // Sprites
    game.load.spritesheet('papajoe', 'assets/sprites/papa_all_31x40.png', 31, 40, 24);
    game.load.spritesheet('oven_sprite', 'assets/sprites/oven_24x40.png', 24, 40, 4);
    game.load.spritesheet('cust_factory_worker_sprite', 'assets/sprites/cust_factory_32x24.png', 32, 24, 9);
    game.load.spritesheet('cust_woman_sprite', 'assets/sprites/cust_woman_32x24.png', 32, 24, 9);
    // game.load.spritesheet('cust_couple_sprite', 'assets/sprites/cust_couple_32x24.png', 32, 24, 9);
    // game.load.spritesheet('cust_mafia_sprite', 'assets/sprites/cust_mafia_32x24.png', 32, 24, 9);
    game.load.spritesheet('yollo', 'assets/sprites/yollo_26x40.png', 26, 40, 18);
    game.load.image('complaint', 'assets/sprites/complaint.png');
    game.load.image('bell', 'assets/sprites/bell.png');

    // Tiles
    game.load.tilemap('floor', 'assets/tiles/level1_Floor.csv', null, Phaser.Tilemap.TILED_CSV);
    game.load.tilemap('oven_map', 'assets/tiles/level1_Oven.csv', null, Phaser.Tilemap.TILED_CSV);
    game.load.tilemap('ladder', 'assets/tiles/level1_Ladder.csv', null, Phaser.Tilemap.TILED_CSV);
    game.load.tilemap('cust_factory_worker_map', 'assets/tiles/level1_Factory.csv', null, Phaser.Tilemap.TILED_CSV);
    game.load.tilemap('cust_woman_map', 'assets/tiles/level1_Woman.csv', null, Phaser.Tilemap.TILED_CSV);
    // game.load.tilemap('cust_mafia_map', 'assets/tiles/level1_Mafia.csv', null, Phaser.Tilemap.TILED_CSV);
    // game.load.tilemap('cust_couple_map', 'assets/tiles/level1_Couple.csv', null, Phaser.Tilemap.TILED_CSV);
    game.load.image('tiles', 'assets/tiles/papaTileset.png');

    // Music
    game.load.audio('opera', ['assets/music/opera.ogg']);
    game.load.audio('credits', ['assets/music/credits.ogg']);
    game.load.audio('game_over', ['assets/music/game_over.ogg']);
    game.load.audio('quadriglia', ['assets/music/quadriglia.ogg']);
    game.load.audio('start', ['assets/music/start.ogg']);
    game.load.audio('title', ['assets/music/title.ogg']);
    game.load.audio('victory', ['assets/music/victory.ogg']);

    // SFX
    game.load.audio('step_1', ['assets/sfx/step_1.ogg']);
    game.load.audio('step_2', ['assets/sfx/step_2.ogg']);
    game.load.audio('complaint', ['assets/sfx/complaint.ogg']);
    game.load.audio('falling', ['assets/sfx/falling.ogg']);
    game.load.audio('order_up', ['assets/sfx/order_up.ogg']);
    game.load.audio('oven', ['assets/sfx/oven.ogg']);
    game.load.audio('pause_select', ['assets/sfx/pause_select.ogg']);
    game.load.audio('pickup', ['assets/sfx/pickup.ogg']);
    game.load.audio('score', ['assets/sfx/score.ogg']);
}

function create() {
    setupWorld();
    createTiles();
    createOvens();
    createCustomers();
    createPapaJoe();
    createAudio();
    // createStrikes();
    bindKeyboardEvents();
    bindAudio();
    bindCustomerTimers();
}

function setupWorld() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.backgroundColor = "#000";
}

function createTiles() {
    ladderMap = game.add.tilemap('ladder', 8, 8);
    ladderMap.addTilesetImage('tiles');
    ladderMap.setCollisionBetween(0, 960);
    ladderLayer = ladderMap.createLayer(0);
    ladderLayer.resizeWorld();

    floorMap = game.add.tilemap('floor', 8, 8);
    floorMap.addTilesetImage('tiles');
    floorMap.setCollisionBetween(0, 960);
    floorLayer = floorMap.createLayer(0);
    floorLayer.resizeWorld();
}

function createOvens() {
    ovens = game.add.group();
    yollos = game.add.group();

    ovenMap = game.add.tilemap('oven_map', 8, 8);
    ovenMap.addTilesetImage('tiles');
    ovenLayer = ovenMap.createLayer(0);
    
    ovenLayer.resizeWorld();
    
    ovenMap.forEach(function (tile, x) {
        if (x > 0 && tile.index > 0) {
            if (ovenMap.getTile(tile.x - 1, tile.y + 1, ovenLayer) == null &&
                ovenMap.getTile(tile.x + 1, tile.y + 1, ovenLayer) == null &&
                ovenMap.getTile(tile.x - 1, tile.y - 1, ovenLayer) == null) {
                    
                var tile = ovenMap.getTile(tile.x, tile.y, ovenLayer);
                var ovenY = tile.worldY;
                var ovenX = tile.worldX;
                
                ovens.add(game.add.tileSprite(ovenX - 8, ovenY - 32, 24, 40, 'oven_sprite'));
                yollos.add(game.add.tileSprite(ovenX - 20, ovenY - 32, 26, 40, 'yollo'));

                ovensData.push({"active": false, "collide": false});
            }
        }
    });

    ovenMap.destroy();
    ovenLayer.destroy();

    ovens.children.forEach(function (oven) {
        oven.animations.add('oven_animation', [0, 1, 2, 3]);
        oven.animations.play('oven_animation', ovenFPS, true);
    });

    yollos.children.forEach(function (yollo) {
        yollo.animations.add('yollo_idle', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        yollo.animations.play('yollo_idle', yolloFPS, true);
    });
}

function createCustomers() {
    createWomanCustomers();
    createFactoryWorkerCustomers();
}

function createWomanCustomers() {
    var indexCount = 0;
    customersWoman = game.add.group();
    womanMap = game.add.tilemap('cust_woman_map', 8, 8);
    womanMap.addTilesetImage('tiles');
    womanLayer = womanMap.createLayer(0);
    womanLayer.resizeWorld();
    
    womanMap.forEach(function (tile, x, i) {
        if (x > 0 && tile.index > 0) {
            if (womanMap.getTile(tile.x + 1, tile.y, womanLayer) == null &&
                womanMap.getTile(tile.x, tile.y + 1, womanLayer) == null) {

                var custY = womanMap.getTile(tile.x, tile.y, womanLayer).worldY;
                var custX = womanMap.getTile(tile.x, tile.y, womanLayer).worldX;
                
                var newCust = game.add.tileSprite(custX - 24, custY - 16, 32, 24, 'cust_woman_sprite');

                // newCust.orderInterval = orderIntervals.woman.req;
                // newCust.waitInterval = orderIntervals.woman.wait;

                customersWoman.add(newCust);
                
                customers.push({ 
                    "active": false, 
                    "collide": false, 
                    "order": false, 
                    "index": indexCount, 
                    "group": customersWoman,
                    "orderInterval": orderIntervals.woman.req,
                    "waitInterval": orderIntervals.woman.wait
                })
                indexCount++;
            }
        }
    });

    womanMap.destroy();
    womanLayer.destroy();

    customersWoman.children.forEach(function (cust) {
        cust.animations.add('cust_woman_animation', [0, 1, 2, 3]); // , 4, 5, 6, 7, 8
        cust.animations.play('cust_woman_animation', customerFPS, true);
    });
}

function createFactoryWorkerCustomers() {
    var indexCount = 0;
    customersFactory = game.add.group();
    factoryMap = game.add.tilemap('cust_factory_worker_map', 8, 8);
    factoryMap.addTilesetImage('tiles');
    factoryLayer = factoryMap.createLayer(0);
    factoryLayer.resizeWorld();

    factoryMap.forEach(function (tile, x) {
        if (x > 0 && tile.index > 0) {
            if (factoryMap.getTile(tile.x + 1, tile.y, factoryLayer) == null &&
                factoryMap.getTile(tile.x, tile.y + 1, factoryLayer) == null) {

                var custY = factoryMap.getTile(tile.x, tile.y, factoryLayer).worldY;
                var custX = factoryMap.getTile(tile.x, tile.y, factoryLayer).worldX;

                var newCust = game.add.tileSprite(custX - 24, custY - 16, 32, 24, 'cust_factory_worker_sprite')

                // newCust.orderInterval = orderIntervals.factory.req;
                // newCust.waitInterval = orderIntervals.factory.wait;
                
                customersFactory.add(newCust);

                customers.push({ 
                    "active": false, 
                    "collide": false, 
                    "order": false, 
                    "index": indexCount, 
                    "group": customersFactory,
                    "orderInterval": orderIntervals.factory.req,
                    "waitInterval": orderIntervals.factory.wait
                })
                indexCount++;
            }
        }
    });

    factoryMap.destroy();
    factoryLayer.destroy();

    customersFactory.children.forEach(function (cust) {
        cust.animations.add('cust_factory_worker_animation', [0, 1, 2, 3]); // , 4, 5, 6, 7, 8
        cust.animations.play('cust_factory_worker_animation', customerFPS, true);
    });
}

function reqTimer(cust, i) {
    var x = cust.group.children[customers[i].index].position.x + 8;
    var y = cust.group.children[customers[i].index].position.y - 4;

    cust.reqTimer = game.time.create(true);

    cust.reqTimer.add(cust.orderInterval, function () {
        console.log("Order Up!")
        if (cust.order) {
            cust.order.destroy();
        }
        cust.order = game.add.sprite(x, y, 'bell');
        order_up_sfx.play();

        cust.waitTimer.start();
    }, this);
}

function waitTimer(cust, i) {
    var x = cust.group.children[customers[i].index].position.x + 8;
    var y = cust.group.children[customers[i].index].position.y - 4;

    cust.waitTimer = game.time.create(true);

    cust.waitTimer.add(cust.waitInterval, function () {
        cust.order.destroy();
        cust.order = game.add.sprite(x, y, 'complaint');
        complaint_sfx.play();

        cust.reqTimer.destroy()
        cust.waitTimer.destroy()

        waitTimer(cust, i);
        reqTimer(cust, i);

        cust.reqTimer.start()

    }, this);
}

function bindCustomerTimers() {
    customers.map(function(c, i) {
        var cust = customers[i];
        
        waitTimer(cust, i);
        reqTimer(cust, i);

        cust.reqTimer.start()
    })
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createPapaJoe() {
    papajoe = game.add.sprite(120, 20, 'papajoe');
    game.physics.arcade.enable(papajoe);
    papajoe.anchor.set(0.5);
    papajoe.body.setSize(8, 4, 12, 28);

    papajoe.animations.add('walk', [0, 1, 2, 3]);
    papajoe.animations.add('pizza', [4, 5, 6, 7]);
    papajoe.animations.add('down', [8, 9, 10, 11]);
    papajoe.animations.add('up', [12, 13, 14, 15]);
    papajoe.animations.add('downPizza', [16, 17, 18, 19]);
    papajoe.animations.add('upPizza', [20, 21, 22, 23]);
}

function createAudio() {
    opera_music = game.add.audio('opera');
    opera_music.loop = true;

    step_1_sfx = game.add.audio('step_1');
    step_2_sfx = game.add.audio('step_2');
    falling_sfx = game.add.audio('falling');

    oven_sfx = game.add.audio('oven');
    pickup_sfx = game.add.audio('pickup');

    order_up_sfx = game.add.audio('order_up');
    complaint_sfx = game.add.audio('complaint');

    score_sfx = game.add.audio('score');

    step_1_sfx.volume = 0.5;
    step_2_sfx.volume = 0.5;


    // // SFX
    // game.load.audio('pause_select', ['assets/sfx/pause_select.ogg']);
    // game.load.audio('score', ['assets/sfx/score.ogg']);
}

function bindKeyboardEvents() {
    cursors = game.input.keyboard.createCursorKeys();
    pizzaKey = game.input.keyboard.addKey(Phaser.Keyboard.P);
    walkKey = game.input.keyboard.addKey(Phaser.Keyboard.O);
}

function bindAudio() {
    opera_music.play();
}

function update() {
    if (!pauseMovementUpdate) {
        checkWrap();

        if (pizzaKey.isDown) {
            hasPizza = true;
            animate("leftRightPizza");
        }
        if (walkKey.isDown) {
            hasPizza = false;
            animate("leftRight");
        }

        if (!falling) {
            if (cursors.up.isDown) {
                pauseMovementUpdate = true;
                game.time.events.add(animationIntervals.up, function () {
                    moveUp();
                });
            } else if (cursors.down.isDown) {
                pauseMovementUpdate = true;
                game.time.events.add(animationIntervals.down, function () {
                    moveDown();
                });
            } else if (cursors.left.isDown) {
                pauseMovementUpdate = true;
                game.time.events.add(animationIntervals.left, function () {
                    moveLeft();
                });
            } else if (cursors.right.isDown) {
                pauseMovementUpdate = true;
                game.time.events.add(animationIntervals.right, function () {
                    moveRight();
                });
            } 
        }
        else if (falling) {
            pauseMovementUpdate = true;
            game.time.events.add(animationIntervals.fall, function () {
                if (canGoD) {
                    fall();
                }
                else {
                    pauseMovementUpdate = false;
                }
            });
        }
    }

    checkTilesUp();
    checkTilesDown();
    checkOvenCollisions();
    checkCustomerCollisions();
}

function checkOvenCollisions() {
    var x = papajoe.position.x;
    var y = papajoe.position.y - 28;

    for (i = 0; i < ovens.children.length; i++) {
        var oven = ovens.children[i];

        var inside = x > oven.x - 4 && x < oven.x + (oven.width + 4);
        var outside = x > oven.x - 4 && x < oven.x + (oven.width + 4);

        if (inside && y == oven.position.y && !hasPizza) {
            ovensData[i].active = true;
        }

        if (!inside && y == oven.position.y) {
            ovensData[i].active = false;
            ovensData[i].collide = false;
        }

        if (ovensData[i].active && !ovensData[i].collide) {
            ovensData[i].collide = true;
            lastYolo = i;
            cookPizza(i);
        }
    } 
}

function cookPizza(i) {
    var pizzaAnim = yollos.children[i].animations.add('yollo_pizza', [11, 12, 13, 14, 15, 16, 17]);

    oven_sfx.play();
    pizzaAnim.onComplete.add(pizzaCooked, this);
    pizzaAnim.play(yolloFPS, false);
    pizzaAnim.onComplete.add(pizzaCooked, this);

    hasPizza = true;
    pickup_sfx.play();
    if (!cursors.up.isDown && !cursors.down.isDown && !cursors.left.isDown && !cursors.right.isDown) {
        animate("leftRightPizza", false, true);
    }
}

function pizzaCooked() {
    yollos.children[lastYolo].animations.play('yollo_idle', yolloFPS, true);

    // if (ovensData[lastYolo].active) {
        // hasPizza = true;
        // pickup_sfx.play();
        // if (!cursors.up.isDown && !cursors.down.isDown && !cursors.left.isDown && !cursors.right.isDown) {
        //     animate("leftRightPizza", false, true);
        // }
    // }
}

function checkCustomerCollisions() {
    customers.map(function(json, i) {
        var x = papajoe.position.x;
        var y = papajoe.position.y - 12;
        var customer = json.group.children[json.index];

        var inside = x > customer.x - 4 && x < customer.x + (customer.width + 4);
        var outside = x > customer.x - 4 && x < customer.x + (customer.width + 4);

        if (inside && y == customer.position.y) {
            customers[i].active = true;
        }

        if (!inside && y == customer.position.y) {
            customers[i].active = false;
            customers[i].collide = false;
        }

        if (customers[i].active && !customers[i].collide && customers[i].order != false && hasPizza) {
            hasPizza = false;
            animate("leftRight", false, true);
            customers[i].collide = true;
            customers[i].order.destroy();
            customers[i].order = false;
            
            customers[i].reqTimer.destroy()
            customers[i].waitTimer.destroy()

            waitTimer(customers[i], i);
            reqTimer(customers[i], i);

            customers[i].reqTimer.start()

            score_sfx.play();
            pickup_sfx.play();
        }
    });
}

function checkWrap() {
    if (papajoe.x <= -12) {
        papajoe.x = 264;
    }
    else if (papajoe.x >= 268) {
        papajoe.x = -8;
    }

    if (papajoe.y == -12) {
        papajoe.y = 248;
    }
    else if (papajoe.y == 252) {
        papajoe.y = -8;
    }
}

function checkTilesDown() {
    var down = { 
        "x": papajoe.body.x, 
        "y": papajoe.body.y 
    };

    canGoD = checkFloor(down);
    
    function checkFloor(pos) {
        var x = Math.round((pos.x) / 8);
        var y = Math.round((pos.y) / 8);

        var xLadderLeft = Math.round((pos.x - 2) / 8);
        var xLadderRight = Math.round((pos.x + 2) / 8);

        var tile1 = floorMap.getTile(x, y + 1, floorLayer);
        var tile2 = floorMap.getTile(x, y, floorLayer);
        var tile3 = ladderMap.getTile(x, y, ladderLayer);
        var tile4 = ladderMap.getTile(x, y - 1, ladderLayer);
        var tile5 = ladderMap.getTile(x, y + 1, ladderLayer);
        var tile6 = floorMap.getTile(xLadderLeft, y, ladderLayer);
        var tile7 = floorMap.getTile(xLadderRight, y, ladderLayer);

        var fallTileLeft = floorMap.getTile(x - 1, y, floorLayer);
        var fallTileRight = floorMap.getTile(x + 1, y, floorLayer);

        // console.log(fallTileLeft, tile3)
        // if (fallTileLeft)

        if (tile6 !== null && tile3 !== null) {
            ladderGotchaLeftDown = true;
        }
        else if (tile7 !== null && tile3 !== null) {
            ladderGotchaRightDown = true;
        }
        else {
            ladderGotchaLeftDown = false;
            ladderGotchaRightDown = false;
        }
        
        if (tile2 === null && tile3 === null && tile4 == null) {
            if (papajoe.y >= 228 && papajoe.y <= 252 || papajoe.y <= -6) {
                if (papajoe.y <= 0 || papajoe.y >= 230) {
                    if (tile4 == null && tile5 === null) {
                        fallingSfxPlayed = true;
                        worldWrap = true;
                    }
                    else {
                        worldWrap = false;
                    }
                }
            }
            else if (papajoe.x <= 0 || papajoe.x >= 254) {
                if (tile4 == null && tile5 === null) {
                    fallingSfxPlayed = true;
                    worldWrap = true;
                }
                else {
                    worldWrap = false;
                }
            }
            else {
                worldWrap = false;
                falling = true;
                if (!fallingSfxPlayed) {
                    fallingSfxPlayed = true;
                    falling_sfx.play();
                }
            }
        }
        else {
            falling = false;
        }

        if (tile1 === null && tile2 === null) {
            grounded = false;
            return true;
        }
        else if (tile1 !== null && tile2 !== null || tile1 === null && tile2 !== null) {
            fallingSfxPlayed = false;
            grounded = true;
            return false;
        }
        else {
            grounded = false;
            return true;
        }
    }
}

function checkTilesUp() {
    var up = {
        "x": papajoe.body.x,
        "y": papajoe.body.y - 4
    };

    canGoU = checkLadder(up);

    function checkLadder(pos) {
        var x = Math.round((pos.x) / 8);
        var y = Math.round((pos.y) / 8);

        var xLadderLeft = Math.round((pos.x - 2) / 8);
        var xLadderRight = Math.round((pos.x + 2) / 8);

        var tile1 = ladderMap.getTile(x, y - 1, ladderLayer);
        var tile2 = ladderMap.getTile(x, y, ladderLayer);

        var tile3 = ladderMap.getTile(xLadderLeft, y, ladderLayer);
        var tile4 = ladderMap.getTile(xLadderRight, y, ladderLayer);

        if (tile3 === null && tile2 !== null) {
            ladderGotchaLeftUp = true;
        }
        else if (tile4 === null && tile2 !== null) {
            ladderGotchaRightUp = true;
        }
        else {
            ladderGotchaLeftUp = false;
            ladderGotchaRightUp = false;
        }
        
        if (tile1 !== null && !grounded  || tile2 != null && !grounded) {
            canGoL = false;
            canGoR = false;
        }
        else {
            canGoL = true;
            canGoR = true;
        }

        if (tile1 !== null && tile2 === null || tile1 === null && tile2 !== null || tile1 !== null && tile2 !== null) {
            return true;
        } else {
            return false;
        }
    }
}

function fall() {
    papajoe.y += animationMovement.fall[animationIndex];
    pauseMovementUpdate = false;
}

function moveUp() {
    if (canGoU || worldWrap) {
        worldWrap = false;

        if (hasPizza) {
            animate("upPizza");
        }
        else {
            animate("up");
        }

        var frame = papajoe.animations.frame;

        if (frame == 12 || frame == 14 || frame == 20 || frame == 22) {
            papajoe.y -= animationMovement.up[animationIndex];
        }

        if (ladderGotchaLeftUp) {
            papajoe.x += 4;
        }
        if (ladderGotchaRightUp) {
            papajoe.x -= 4;
        }
    }
    pauseMovementUpdate = false;
}
function moveDown() {
    if (canGoD) {
        if (hasPizza) {
            animate("downPizza");
        }
        else {
            animate("down");
        }

        var frame = papajoe.animations.frame;

        if (frame == 8 || frame == 10 || frame == 16 || frame == 18) {
            papajoe.y += animationMovement.down[animationIndex];
        }
        
        if (ladderGotchaLeftDown) {
            papajoe.x += 4;
        }
        if (ladderGotchaRightDown) {
            papajoe.x -= 4;
        }
    }

    pauseMovementUpdate = false;
}

function moveLeft() {
    if (canGoL || worldWrap) {
        papajoe.scale.x = -1;
        if (hasPizza) {
            animate("leftRightPizza", true);
            papajoe.x -= animationMovement.leftRightPizza[animationIndex];
        }
        else {
            animate("leftRight");
            papajoe.x -= animationMovement.leftRight[animationIndex];
        }
    }
    pauseMovementUpdate = false;
}

function moveRight() {
    if (canGoR) {
        papajoe.scale.x = 1;
        if (hasPizza) {
            animate("leftRightPizza", true);
            papajoe.x += animationMovement.leftRightPizza[animationIndex];
        } else {
            animate("leftRight");
            papajoe.x += animationMovement.leftRight[animationIndex];
        }
    }
    pauseMovementUpdate = false;
}

function animate(dir, leftRightPizza, skipIndex) {
    papajoe.animations.frame = animationFrames[dir][animationIndex];

    if (!skipIndex) {
        animationIndex++;
    }
    
    if (hasPizza && leftRightPizza) {
        if (animationIndex == 1) {
            if (pizzaWalkSFX == 1) {
                step_1_sfx.play();
                pizzaWalkSFX = 2;
            }
            else {
                step_2_sfx.play();
                pizzaWalkSFX = 1;
            }
        }
    }
    else {
        if (animationIndex == 1) {
            step_1_sfx.play();
        }
        else if (animationIndex == 3) {
            step_2_sfx.play();
        }
    }

    if (animationIndex == 4) {
        animationIndex = 0;
    }
}