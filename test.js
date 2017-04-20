/**
 * Created by a83979 on 4/19/2017.
 */
MG = require('C:/projects/missionBuilder/missionGenerator');
mgData = new MG();
groupName = 'test'.toUpperCase()
mgData.addToGroup(groupName, ['test1', 'test2', 'test3','test4', 'test5', 'test6'])
mgData.masterDictionary

groupList = mgData.masterDictionary[groupName];