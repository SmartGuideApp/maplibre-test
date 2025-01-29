import data from './prg-data.json';


const pois = ([...data.sights.map(x => ({...x, type: 'sight'})), ...data.layer1.map(x => ({...x, type: 'layer1'}))]).map(x => {
    const [latitude, longitude] = x.location.coordinates.split(',').map(Number.parseFloat);
    return ({ id: x.id, name: x.name, priority: x.priority || 0, type: x.type, latitude, longitude });
});

import fs from 'fs';

const poisData = JSON.stringify(pois, null, 2);

fs.writeFile('pois.ts', `const pois = ${poisData};\nexport default pois;`, 'utf8', (err) => {
    if (err) {
        console.error('Error writing to file', err);
    } else {
        console.log('POIs successfully written to pois.js');
    }
});

