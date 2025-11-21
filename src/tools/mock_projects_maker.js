import { faker } from '@faker-js/faker';
import pool from '../config/db.js';


for (let i = 0 ; i< 100 ; i++){
    const registry = faker.helpers.arrayElement(['VCS', 'GLD', 'ART', 'CAR', 'ACR']);
    const project_id = `${registry}${i.toString().padStart(3, '0')}`
    const project_name = `${faker.location.city()} ${faker.helpers.arrayElement([
        'Forest Restoration',
        'Mangrove Offset',
        'Clean Energy Project',
        'Carbon Sequestration',
        'Renewable Energy Initiative',
        'Wetland Conservation'
    ])}`;

    console.log(project_id);
    
    const query = `INSERT INTO projects (project_id, project_name, registry, status, scope, type, removal_or_reduction, methodology, country, project_developer, vintage , verifier, total_issued, total_retired, estimated_annual_emission_reductions) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`

    /*
1. project_id - project_id
2. project_name - project_name
3. registry - registry
4. status - helper
5. scope - helper
6. type - faker.airline.airport()
7. removal_or_reduction - helper
8. methodology - faker.string.alphanumeric(),
9. country - faker.location.country()
10. project_developer - faker.person.fullname()
11. vintage - faker.date.past({years:20}).getFullYear,
12. verifier - faker.company.name()
13. total_issued - faker.number.int({min:1000, max: 1000000}),
14. total_retired - faker.number.int({min:1000, max: 1000000}),
15. estimated_annual_emission_reductions - faker.number.int({min:1000, max: 1000000}),
 */

    await pool.execute(query,[
        project_id,
        project_name,
        registry, 
        faker.helpers.arrayElement(['listed', 'completed']), 
        faker.helpers.arrayElement(['Chemical Processes', 'Agriculture', 'Forestry & Land Use' , 'Waste Management', 'Industrial & Commercial', 'Carbon Capture & Storage', 'Engineered Removal' , 'Household & Community', 'Transportation']),
        faker.airline.airport().name.slice(0,49),
        faker.helpers.arrayElement(['Impermanent Removal', 'Long Duration Removal' , 'Reduction', 'Mixed']), 
        `${registry}-${faker.number.int({min: 0, max: 999}).toString().padStart(3,'0')}`,
        faker.location.country().slice(0,20), 
        faker.person.fullName(),
        faker.date.past().getFullYear(),
        faker.company.name(), 
        faker.number.int({min:1000, max: 1000000}), 
        faker.number.int({min:1000, max: 1000000}),
        faker.number.int({min:1000, max: 1000000}),
    ])

    
}
