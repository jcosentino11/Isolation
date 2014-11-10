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
                sheet: "player1",  // Setting a sprite sheet sets sprite width and height
                sprite: "player",
                type: Q.SPRITE_PLAYER,
                walkingPoints: [ [ -16, 44], [ -23, 35 ], [-23,-48], [23,-48], [23, 35 ], [ 16, 44 ]],
                rollingPoints: Q.generateCirclePoints(0,0,33),
                walkingJumpSpeed: -600,
                rollingJumpSpeed: -300,
                attack: 5,
                maxHealth: Q.state.get('health'),
                health: Q.state.get('health'),
                morphing: false,    //true when morphing
                morph: false,       //true when in morph mode,
                walkingSpeed: 200,
                rollingSpeed: 400,
                bounceBack: 30
            });
            
            this.p.rollAngle = Math.atan(this.p.rollingSpeed/25) * (180 / Math.PI) / 12;
            this.p.points = this.p.walkingPoints;
            this.p.speed = this.p.walkingSpeed;
            this.p.jumpSpeed = this.p.walkingJumpSpeed;
            
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
                this.p.health -= col.obj.p.attack;
                Q.state.set('health',this.p.health);
                
                if(this.p.health > this.p.maxHealth * 0.75) {
                   this.p.sheet = "player1";
                } else if(this.p.health > this.p.maxHealth * 0.5) {
                    this.p.sheet = "player2";
                } else if(this.p.health > this.p.maxHealth * 0.25) {
                    this.p.sheet = "player3";
                } else {
                    this.p.sheet = "player4";
                }

                if(this.p.health <= 0){
                    //player died
                    Q.stageScene("game");
                }

                this.p.x += col.normalX * this.p.bounceBack;
                this.p.y -= this.p.bounceBack / 2;
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
                if((Q.inputs["down"] || Q.inputs["fire"]) && this.p.landed > 0){  //map morph to "A" on mobile for now
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
            this.p.jumpSpeed = this.p.rollingJumpSpeed;
            this.p.cy = 62;
        },
        
        unmorphed: function(){
            this.p.ignoreControls = false;
            this.p.morph = false;
            this.p.morphing = false;
            this.p.points = this.p.walkingPoints;
            this.p.speed = this.p.walkingSpeed;
            this.p.jumpSpeed = this.p.walkingJumpSpeed;
            this.c.points = this.p.walkingCollisionPoints;  //prevent collision errors after changing points
            this.p.cy = 49;
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
    });

    
    Q.Sprite.extend("ShipPart", {
        init: function(p) {
            this._super(p,{
                sheet: "shipPart",
                sensor: true
            });
            
            this.on("sensor");
        },
        
        sensor: function(col) {
            if(col instanceof Q.Player){
                Q.state.inc("parts",1);
                this.destroy();
            }
        }
    });
    
    
    Q.UI.Button.extend("HUD", {
        init: function(p) {
            this._super({
                asset: 'GUI.png',
                x: Q.width - 80,
                y: Q.height - 50
            });
        }
    });
    
    Q.UI.Container.extend("Bar", {
        init: function(p){
            var props = {
                fill: 'rgb(255,255,255)',
                fillColor: 'rgb(255,255,255)', 
                w: 17, 
                h: 67, 
                initialH: 65,
                on: true, 
                countdown: -1, 
                resetCount: 10 
            };
            for(var key in p){ props[key] = p[key]; }
            this._super(props);
            this.p.initialY = this.p.y;
        },
        
        shrink: function() {
            this.p.h *= 0.9;
            this.p.y = this.p.initialY + (this.p.initialH - this.p.h);            
        },
        
        step: function(dt){
            if(this.p.h < this.p.initialH * 0.25){
                if(this.p.countdown < 0){
                    this.p.on = !this.p.on;
                   if(this.p.on){
                       this.p.fill = 'rgba(0,0,0,0)';
                   } else {
                       this.p.fill = this.p.fillColor;
                   }
                    this.p.countdown = this.p.resetCount;
                }
                this.p.countdown--;
            } else {
                this.p.fill = this.p.fillColor;
            }
        }
    });
    
    Q.Bar.extend("HealthBar", {
        init: function(p){
            this._super({
                fill: 'rgb(223,46,46)',
                fillColor: 'rgb(223,46,46)',
                x: Q.width - 108,
                y: Q.height - 49
            });
            
            Q.state.on("change.health", this, "shrink");
        },
        
        step: function(dt){
            this._super(dt);
        }
    });
    
    Q.Bar.extend("OxygenBar", {
        init: function(p){
            this._super({
                fill: 'rgb(46,46,223)',
                fillColor: 'rgb(46,46,223)',
                x: Q.width - 79,
                y: Q.height - 49
            });
            
            Q.state.on("change.oxygen", this, "shrink");
        },
        
        step: function(dt){
            this._super(dt);
        }
    });
    
    Q.Bar.extend("EnergyBar", {
        init: function(p){
            this._super({
                fill: 'rgb(136, 136, 34)',
                fillColor: 'rgb(136, 136, 34)',
                x: Q.width - 50,
                y: Q.height - 49
            });
            
            Q.state.on("change.energy", this, "shrink");
        },
        
        step: function(dt){
            this._super(dt);
        }
    });
        

    ////Scenes///////////////////////////////////////////////////

    Q.scene('hud',function(stage){
        stage.insert(new Q.HealthBar());
        stage.insert(new Q.OxygenBar());
        stage.insert(new Q.EnergyBar());
        stage.insert(new Q.HUD());
        
    });

    Q.scene('game',function(stage) {
        Q.state.reset({health: 20, parts: 0});
        Q.stageScene('hud',1);
        Q.stageTMX("level1.tmx",stage);
        stage.add("viewport").follow(Q("Player").first());

        var enemy = stage.insert(new Q.Jumper({x: 800, y: 200}));
    });

    ////Asset Loading  & Game Start//////////////////////////////

    Q.loadTMX(['level1.tmx','player1.png','player1.json','player2.png','player2.json','player3.png','player3.json','player4.png','player4.json','GUI.png','shipParts.png','shipParts.json'], function() {
        Q.compileSheets('player1.png','player1.json');
        Q.compileSheets('player2.png','player2.json');
        Q.compileSheets('player3.png','player3.json');
        Q.compileSheets('player4.png','player4.json');
        Q.compileSheets('shipParts.png','shipParts.json');
        
        Q.animations("player", {
            walk_right: { frames: [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip: false, loop: true },
            walk_left: { frames:  [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip:"x", loop: true },
            jump_right: { frames: [13], rate: 1/10, flip: false },
            jump_left: { frames:  [13], rate: 1/10, flip: "x" },
            stand_right: { frames:[14], rate: 1/10, flip: false },
            stand_left: { frames: [14], rate: 1/10, flip:"x" },
            morphing: { frames: [18,19,20,21,22], rate: 1/5, trigger: "morphed", loop: false },
            unmorphing: {frames: [22,21,20,19,18], rate: 1/5, trigger: "unmorphed", loop: false }
            
            
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