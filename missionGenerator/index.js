
'use strict';

var fs = require('fs');
var mgData;

function MissionGenerator() {
    mgData = this;
    mgData.regexBracket = /(\[[\w|_|\.]+\])/;
    mgData.masterDictionary = {};
}

module.exports = MissionGenerator;

MissionGenerator.prototype.addDictionary = function(dictionaryData){
    mgData.masterDictionary = dictionaryData;
};
MissionGenerator.prototype.saveDictionary = function(filename){
    var dictionaryText = JSON.stringify(this.masterDictionary);
    fs.writeFile(filename, dictionaryText, function (err) {
        if (err) return console.log(err);
    });
};
MissionGenerator.prototype.loadDictionary = function(filename){
    console.log(filename);
    fs.readFile(filename, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        console.log(JSON.parse(data));
        mgData.masterDictionary=JSON.parse(data);
    });
};

MissionGenerator.prototype.resolveGroup = function(m){
    var groupNameBracket, phrase;
    if (typeof m === 'string'){
            groupNameBracket = m.toUpperCase();
        } else {
            groupNameBracket = m.toUpperCase();
        }
        var groupName = groupNameBracket.replace('[', '').replace(']', '');
        if (groupName.startsWith('DICE.')){
            var dice = groupName.slice(5).split('D');
            var sum = 0;
            for (var i = 0; i < dice[0]; i++){
                sum += Math.floor((Math.random() * dice[1]) + 1);
            }
            phrase = sum.toString();
        }else{
            var groupList = mgData.masterDictionary[groupName];
            console.log('groupname: ' + groupName);
            if (!groupList){
                return '+++'+groupName+'+++';
            } else {
                var wd = mgData.buildWeightedDictionary(groupList);
                phrase = mgData.weighted_choice(wd);
            }
        }
        if (mgData.regexBracket.test(phrase)){
            return mgData.run(phrase);
        } else {
            return phrase;
        }
    };

MissionGenerator.prototype.buildWeightedDictionary = function(list){
    var regexGators = /\<(.*)\>/;
    var choices = [];
    var weight;
    for (var i = 0; i < list.length; i++) {
        var entry = list[i];
        var weightGator = regexGators.exec(entry);
        if (weightGator){
            weight = parseInt(weightGator[1]);
            entry = entry.slice(weightGator[1].length+2);
        }else{
            weight = 1;
        }
        choices.push({key:entry,value:weight});
    }
    return choices
};

MissionGenerator.prototype.weighted_choice = function (choices) {
    //find the sum of choices
    var total = 0;
    for (var i = 0; i < choices.length; i++) {
        total += choices[i].value;
    }
    //create a random number between 1 and the sum of weights
    var r = Math.floor((Math.random() * total) + 1);
    //now get the first one where wieght + total > random number
    var upto = 0;
    for (i = 0; i < choices.length; i++){
        upto += choices[i].value;
        if (r  <= upto){
            return choices[i].key;
        }
    }
}

MissionGenerator.prototype.run = function (phrase){
    phrase = phrase.replace(mgData.regexBracket, mgData.resolveGroup);
    if(mgData.regexBracket.test(phrase)){
       phrase = mgData.run(phrase);
    }
    return phrase;
};