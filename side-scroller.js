$(function() {
    var Q = window.Q = Quintus()
                       .include('Input,Sprites,Scenes,Touch,UI,TMX,Anim,2D')
                       .setup({width: 1000, height: 300})
                       .controls()
                       .touch();

    Q.SPRITE_PLAYER = 1;
    
    
    
//    Q.debug = true;
//    Q.debugFill = true;
    

    Q.generateCirclePoints = function(a,b,r){
        var out = [];
        for(var i=0;i<Math.PI*2;i+=Math.PI/10){
            var x = Math.round(a + r * Math.cos(i));
            var y = Math.round(b + r * Math.sin(i));
            var point = [x,y];
            out.push(point);
        }
        return out;
    }
    
    
    ////Classes//////////////////////////////////////////////////

    /*
    Class: Q.Player
    Extends: Q.Sprite
    Overrides: init, step
    */
    Q.Sprite.extend("Player",{
        init: function(p) {
            this._super(p,{
                sheet: "player",  // Setting a sprite sheet sets sprite width and height
                sprite: "player",
                type: Q.SPRITE_PLAYER,
                walkingPoints: [ [ -16, 44], [ -23, 35 ], [-23,-48], [23,-48], [23, 35 ], [ 16, 44 ]],
                rollingPoints: Q.generateCirclePoints(0,15,32),
                jumpSpeed: -400,
                attack: 5,
                health: Q.state.get('health'),
                morphing: false,    //true when morphing
                morph: false,       //true when in morph mode,
                walkingSpeed: 200,
                rollingSpeed: 300,
            });
            
            this.p.rollAngle = Math.atan(this.p.rollingSpeed/25) * (180 / Math.PI) / 12;
            this.p.points = this.p.walkingPoints;
            this.p.speed = this.p.walkingSpeed;
            
            this.add('2d, platformerControls, animation, tween');

            this.on('bump.bottom',this,'stomp');
            this.on('bump.top',this,'attacked');
            this.on('bump.left',this,'attacked');
            this.on('bump.right',this,'attacked');
            this.on('morphed',this,'morphed');
            this.on('unmorphed',this,'unmorphed');
        },

        attacked: function(col){
            if(col.obj instanceof Q.Enemy){
                console.log(this.p.health)
                this.p.health -= col.obj.p.attack;
                Q.state.set('health',this.p.health);

                if(this.p.health <= 0){
                    //player died
                    Q.stageScene("game");
                }

                //add bounceback?
                // this.p.vx = col.impact * col.normalX;
                // this.p.vy = col.impact * col.normalY;
            }
        },

        stomp: function(col){
            if(col.obj instanceof Q.Enemy){ 
                col.obj.trigger('attack',this.p.attack);
                this.p.vy = this.p.jumpSpeed / 2;
            }
            
        },

        walk: function(dt){ 
            if(this.p.vx > 0) {
                if(this.p.landed > 0) {
                    this.play("walk_right");
                } else {
                    this.play("jump_right");
                }
                this.p.direction = "right";
            } else if(this.p.vx < 0) {
                if(this.p.landed > 0) {
                    this.play("walk_left");
                } else {
                    this.play("jump_left");
                }
                this.p.direction = "left";
            } else {
                this.play("stand_" + this.p.direction);
            }
        },
        
        roll: function(dt){
            if(this.p.vx > 0) {
                this.p.angle += this.p.rollAngle;
            } else if(this.p.vx < 0) {
                this.p.angle -= this.p.rollAngle;
            }
        },

        step: function(dt) {
            if(!this.p.morphing){
                if(this.p.morph){
                   this.roll(dt); 
                }else{
                    this.walk(dt);
                }
                if(Q.inputs["down"]){
                    if(this.p.morph){
                        this.p.angle = 0;
                        this.play("unmorphing",1);
                    }else{
                        this.p.walkingCollisionPoints = this.c.points.slice(0);
                        this.play("morphing",1);
                    }
                    this.p.morphing = true;
                    this.p.ignoreControls = true;
                    this.p.vx = 0;
                }
            }
        },
        
        morphed: function(){
            this.p.ignoreControls = false;
            this.p.morph = true;
            this.p.morphing = false;
            this.p.points = this.p.rollingPoints;
            this.p.speed = this.p.rollingSpeed;
        },
        
        unmorphed: function(){
            this.p.ignoreControls = false;
            this.p.morph = false;
            this.p.morphing = false;
            this.p.points = this.p.walkingPoints;
            this.p.speed = this.p.rollingSpeed;
            this.c.points = this.p.walkingCollisionPoints;  //prevent collision errors after changing points
        }
    });

    Q.Sprite.extend("Enemy", {
        init: function(p) {
            this._super(p, {
                sheet: "player",
                sprite: "enemy",
                scale: 0.6,
                health: 5,
                points: [ [ -16, 44], [ -23, 35 ], [-23,-48], [23,-48], [23, 35 ], [ 16, 44 ]],
                jumpSpeed: -200,
                attack: 1,
                direction: "right"
            });

            this.add('2d, animation, tween');

            this.on('attack',this,'attacked');
        },

        move: function(dt){
            if(this.p.vx > 0) {
                if(this.p.landed > 0) {
                    this.play("walk_right");
                } else {
                    this.play("jump_right");
                }
                this.p.direction = "right";
            } else if(this.p.vx < 0) {
                if(this.p.landed > 0) {
                    this.play("walk_left");
                } else {
                    this.play("jump_left");
                }
                this.p.direction = "left";
            } else {
                this.play("stand_" + this.p.direction);
            }
        },

        attacked: function(attack){
            this.p.health -= attack;
            if(this.p.health <= 0){
                this.destroy();
            }
        },

        step: function(dt){
            this.move(dt);
        }
    });

    Q.Enemy.extend("Jumper", {
        init: function(p) {
            this._super(p);
            this.p.resetCount = 50;
            this.p.count = this.p.resetCount;
            this.p.jumpSpeed = -400;    
        },

        jump: function(){
            this.p.vy = this.p.jumpSpeed;
        },

        step: function(dt){
            this._super();
            if(this.p.count === 0){
                this.jump();
                this.p.count = this.p.resetCount;
            }

            this.p.count--;
        }
    });

    Q.Enemy.extend("Roamer", {
        init: function(p) {
            this._super(p);
        },

        step: function(dt){

        }
    })


    Q.UI.Text.extend("Health",{
        init: function(p){
            this._super({
                label: "health: " + Q.state.get("health"),
                x: 70,
                y: 20,
                size: 18,
                family: "Tahoma",
                color: "black"
            });

            Q.state.on("change.health",this,"health");
        },

        health: function(health){
            this.p.label = "health: " + health;
        }
    });

    ////Scenes///////////////////////////////////////////////////

    Q.scene('hud',function(stage){
        stage.insert(new Q.Health());
    });

    Q.scene('game',function(stage) {
        Q.state.reset({health: 20});
        Q.stageScene('hud',1);
        Q.stageTMX("level1.tmx",stage);
        stage.add("viewport").follow(Q("Player").first());

        var enemy = stage.insert(new Q.Jumper({x: 800, y: 200}));
    });

    ////Asset Loading  & Game Start//////////////////////////////

    Q.loadTMX(['level1.tmx','player.png','player.json'], function() {
        Q.compileSheets('player.png','player.json');
        Q.animations("player", {
            walk_right: { frames: [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip: false, loop: true },
            walk_left: { frames:  [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip:"x", loop: true },
            jump_right: { frames: [13], rate: 1/10, flip: false },
            jump_left: { frames:  [13], rate: 1/10, flip: "x" },
            stand_right: { frames:[14], rate: 1/10, flip: false },
            stand_left: { frames: [14], rate: 1/10, flip:"x" },
            morphing: { frames: [18,19,20,21,22], rate: 1/2, trigger: "morphed", loop: false },
            unmorphing: {frames: [22,21,20,19,18], rate: 1/2, trigger: "unmorphed", loop: false }
            
            
            // duck_right: { frames: [15], rate: 1/10, flip: false },
            // duck_left: { frames:  [15], rate: 1/10, flip: "x" },
            // climb: { frames:  [16, 17], rate: 1/3, flip: false }
        });

        Q.animations("enemy", {
            walk_right: { frames: [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip: false, loop: true },
            walk_left: { frames:  [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip:"x", loop: true },
            jump_right: { frames: [13], rate: 1/10, flip: false },
            jump_left: { frames:  [13], rate: 1/10, flip: "x" },
            stand_right: { frames:[14], rate: 1/10, flip: false },
            stand_left: { frames: [14], rate: 1/10, flip:"x" },
            // duck_right: { frames: [15], rate: 1/10, flip: false },
            // duck_left: { frames:  [15], rate: 1/10, flip: "x" },
            // climb: { frames:  [16, 17], rate: 1/3, flip: false }
        });

        Q.stageScene('game');
    });
});