
'use strict';

var fs = require('fs');
var mgData;

function MissionGenerator() {
    mgData = this;
    mgData.regexBracket = /(\[[\w|_|\s\.\%\<\>]+\])/;
    mgData.masterDictionary = {};
    mgData.usage = {};
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
    fs.readFile(filename, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        mgData.masterDictionary=JSON.parse(data);
    });
};

MissionGenerator.prototype.resolveGroup = function(m){
    var groupNameBracket, phrase;

    var groupNameTop = m.replace('[', '').replace(']', '');
    var groupNames = groupNameTop.split('|');
    var groupwd = mgData.buildWeightedDictionary(groupNames);
    var groupNameIn = mgData.weighted_choice(groupwd);
    var groupName = groupNameIn.toUpperCase();
    var returnVal = "";

    if (groupName.startsWith('DICE.')) {
        var dice = groupName.slice(5).split('D');
        var sum = 0;
        for (var i = 0; i < dice[0]; i++) {
            sum += Math.floor((Math.random() * dice[1]) + 1);
        }
        phrase = sum.toString();
    }else if (groupName.startsWith('%')){
        groupName = groupName.replace('%','');

        if(mgData.usage[groupName]){
            phrase = mgData.usage[groupName];
        } else {
            phrase = mgData.run(m.replace('%',''));
            mgData.usage[groupName] = phrase;
        }
    }else{
        var groupList = mgData.masterDictionary[groupName];
        if (!groupList){
            phrase = groupNameIn;
        } else {
            var wd = mgData.buildWeightedDictionary(groupList);
            phrase = mgData.weighted_choice(wd);
        }
    }

    if (mgData.regexBracket.test(phrase)){
        returnVal = mgData.run(phrase);
    } else {
        returnVal = phrase;
    }
    return returnVal;
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

MissionGenerator.prototype.addToGroup = function (groupName, phrases){
    groupName = groupName.toUpperCase();
    var groupList = mgData.masterDictionary[groupName];
    if (!Array.isArray(phrases)){
        phrases = [phrases];
    }
    if (groupList){
        mgData.masterDictionary[groupName]=groupList.concat(phrases);
    }else{
        mgData.masterDictionary[groupName] = phrases;
    }
}

MissionGenerator.prototype.resetUsage = function (phrase){
        delete mgData.usage[phrase];
}

MissionGenerator.prototype.run = function (phrase){
    phrase = phrase.replace(mgData.regexBracket, mgData.resolveGroup);
    if(mgData.regexBracket.test(phrase)){
       phrase = mgData.run(phrase);
    }
    return phrase;
};