$(function() {
    var Q = window.Q = Quintus()
                       .include('Input,Sprites,Scenes,Touch,UI,TMX,Anim,2D')
                       .setup({width: 1000, height: 300})
                       .controls()
                       .touch();

    Q.SPRITE_PLAYER = 1;

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
                x: 250,
                y: 100
            });
            this.add('2d, platformerControls, animation, tween');
        },

        step: function(dt) {
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
        }
    });

    ////Scenes///////////////////////////////////////////////////

    Q.scene('game',function(stage) {
        Q.stageTMX("level1.tmx",stage);
        var player = stage.insert(new Q.Player());
        stage.add("viewport").follow(player);
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
            duck_right: { frames: [15], rate: 1/10, flip: false },
            duck_left: { frames:  [15], rate: 1/10, flip: "x" },
            climb: { frames:  [16, 17], rate: 1/3, flip: false }
        });
        Q.stageScene('game');
    });
});