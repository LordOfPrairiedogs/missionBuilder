/**
 * Created by dar on 4/14/17.
 */
MG = require('./missionGenerator');
missionGenerator = new MG();
missionGenerator.loadDictionary('spycraft.json');
for (var i=0;i<10;i++){
    missionGenerator.run('[main]');
}