$(function() {
    var Q = window.Q = Quintus()
                       .include('Input,Sprites,Scenes,Touch,UI')
                       .setup()
                       .controls()
                       .touch();

    ////Classes//////////////////////////////////////////////////

    /*
    Class: Q.Player
    Extends: Q.Sprite
    Overrides: init, step
    */
    Q.Sprite.extend("Player",{
        init: function(p) {
            this._super(p,{
                //init properties
            });
        },

        step: function(dt) {

        }
    });

    ////Scenes///////////////////////////////////////////////////

    Q.scene('game',function(stage) {

    });

    ////Asset Loading  & Game Start//////////////////////////////

    Q.load(['side-scroller.png','side-scroller.json'], function() {
        Q.compileSheets('side-scroller.png','side-scroller.json');
        Q.stageScene('game');
    });
});