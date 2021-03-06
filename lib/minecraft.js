 //     minecraft-pi-promise 0.5.0
 //     (c) 2013 Zachary Bruggeman <talkto@zachbruggeman.me>
 //     (c) 2015 Lars Gregori <lars.gregori@choas.net>
 //     minecraft-pi-promise is licensed under the MIT license.

// ## Dependencies
var net    = require('net');
var os     = require('os');
var Blocks = require('./blocks.json');
var Colors = require('./colors.json');

// ## Constructor
function Minecraft (host, port, hello) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {

        self.connection = net.connect({port: port, host: host}, function () {
            // When a new `Minecraft` is created, it connects to the port and host given.
            console.log('Connected to server!');
            if (hello == undefined) {
                self.chat('Client '  + os.hostname() + ' connected.');
            } else if (hello.length > 0) {
                self.chat(hello);
            }
            
            resolve(self);
        });

        self.connection.on('end', function() {
            console.log('Server disconnected.');
        });

    });

    return promise;
};

// `Blocks` holds names of each block, tied to an item ID. This allows for an easier way to reference blocks.
Minecraft.prototype.blocks = Blocks;

// `Colors` holds color data codes, which are used to create colored wool.
Minecraft.prototype.colors = Colors;

// If you're wanting to write your own API, make sure that your commands written end with a new line! Without it, the commands will not work.
Minecraft.prototype.send = function (command) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self.connection.write(command + '\n');
        resolve();
    });

    return promise;
};

Minecraft.prototype.sendReceive = function (command) {

    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self.send(command)
        .then(function() {
            self.connection.on('data', function(data) { 
                resolve(data.toString());
            });            
        });
    });

    return promise;
};

Minecraft.prototype.end = function () {
    this.connection.destroy();
};

// ## Commands

// ### World Commands
// `client.getBlock(x, y, z)` -- Returns the block ID at the selected coordinates.
Minecraft.prototype.getBlock = function (x, y, z) {
    return this.sendReceive('world.getBlock(' + x + ',' + y + ',' + z + ')');
};

// `client.getBlockWithData(x, y, z)` -- Returns the block ID and data at the selected coordinates.
Minecraft.prototype.getBlockWithData = function (x, y, z) {
    return this.sendReceive('world.getBlockWithData(' + x + ',' + y + ',' + z + ')');
};

// `client.setBlock(x, y, z, id, [data])` -- Places a block with the ID of `id` at the selected coordinates, plus data if it is appended. You can use `client.blocks['BLOCK_NAME']` instead of the actual ID.
Minecraft.prototype.setBlock = function (x, y, z, id, data) {
    var command = data ? this.send('world.setBlock(' + x + ',' + y + ',' + z + ',' + id + ',' + data + ')') : this.send('world.setBlock(' + x + ',' + y + ',' + z + ',' + id + ')');
    return command;
};

// `client.setBlocks(x1, y1, z1, x2, y2, z2, id, [data])` -- Places a cuboid of blocks with the coordinate set using the specified id and data. You can use `client.blocks['BLOCK_NAME']` instead of the actual ID.
Minecraft.prototype.setBlocks = function (x1, y1, z1, x2, y2, z2, id, data) {
    var command = data ? this.send('world.setBlocks(' + x1 + ',' + y1 + ',' + z1 + ',' + x2 + ',' + y2 + ',' + z2 + ',' + id + ',' + data + ')') : this.send('world.setBlocks(' + x1 + ',' + y1 + ',' + z1 + ',' + x2 + ',' + y2 + ',' + z2 + ',' + id + ')');
    return command;
};

// `client.getHeight(x, z)` -- Returns the Y coordinate of the last block that isn't solid from the top-down in the coordinate pair.
Minecraft.prototype.getHeight = function (x, z) {
    return this.sendReceive('world.getHeight(' + x + ',' + z + ')');
};

// `client.saveCheckpoint()` -- Saves a checkpoint that can be used to restore the world.
Minecraft.prototype.saveCheckpoint = function () {
    return this.send('world.checkpoint.save()');
};

// `client.restoreCheckpoint()` -- Restores to the last checkpoint.
Minecraft.prototype.restoreCheckpoint = function () {
    return this.send('world.checkpoint.restore()');
};

// `client.worldSetting(key, value)` -- Sets a world property.
// 
// Values are boolean, 0 or 1. The current two keys are:
// 
// * `world_immutable`
// * `nametags_visible`
Minecraft.prototype.worldSetting = function (key, value) {
    return this.send('world.setting(' + key + ',' + value + ')');
};

// `client.getPlayerIds()` -- Returns the entity IDs of the players online.
Minecraft.prototype.getPlayerIds = function () {
    return this.sendReceive('world.getPlayerIds()');
};

// `client.chat(message)` -- Displays a message in the chat.
Minecraft.prototype.chat = function (message) {
    return this.send('chat.post(' + message + ')');
};

// ### Camera Commands
// `client.setCameraMode(mode)` -- Sets the player's camera mode. Accepts `normal`, `thirdPerson` and `fixed`.
Minecraft.prototype.setCameraMode = function (mode) {
    var self = this;
    switch (mode) {
        case 'normal':
        return self.send('camera.mode.setNormal()');
        break;
        case 'thirdPerson':
        return self.send('camera.mode.setThirdPerson()');
        break;
        case 'fixed':
        return self.send('camera.mode.setFixed()');
        break;
    };
};

// `client.setCameraPosition(x, y, z)` -- Sets the camera's position at the selected coordinates.
Minecraft.prototype.setCameraPosition = function (x, y, z) {
    return this.send('camera.mode.setPos(' + x + ',' + y + ',' + z + ')');
};

// ### Player commands
// `client.getTile()` -- Gets the player's coordinates to the nearest block.
Minecraft.prototype.getTile = function () {
    return this.sendReceive('player.getTile()');
};

// `client.setTile(x, y, z)`-- Sets the player's coordinates to the specified block.
Minecraft.prototype.setTile = function (x, y, z) {
    return this.send('player.setTile(' + x + ',' + y + ',' + z + ')');
};

// `client.getPos()` -- Gets the precise position of the player.
Minecraft.prototype.getPos = function () {
    return this.sendReceive('player.getPos()');
};

// `client.setPos(x, y, z)` -- Sets the position of the player precisely.
Minecraft.prototype.setPos = function (x, y, z) {
    return this.send('player.setPos(' + x + ',' + y + ',' + z + ')');
};

// `client.playerSetting(key, value)` -- Sets a player property.
// 
// Values are boolean, 0 or 1. The current key available is:
// 
// * `autojump`
Minecraft.prototype.playerSetting = function (key, value) {
    return this.send('player.setting(' + key + ',' + value + ')');
};

// ### Event commands
// These are in need of proper documentation. If you know about these, please send a pull request! :-)
Minecraft.prototype.eventsBlockHits = function() {
    return this.sendReceive('events.block.hits()');
};

Minecraft.prototype.eventsClear = function() {
    return this.send('events.clear()');
};

// ## Exports
module.exports = Minecraft;
