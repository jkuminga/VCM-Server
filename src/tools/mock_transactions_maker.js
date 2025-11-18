import { faker } from "@faker-js/faker";
import pool from "../config/db.js";

for (let i = 0 ; i< 100 ; i++){
    const query = `INSERT INTO ex_transactions (project_id, quantity, transaction_date, transaction_type, vintage) VALUES (?,?,?,?,?)`
    // console.log([
    //     faker.helpers.arrayElement(['VCS005', 'GS003']),
    //     faker.number.int({min:0, max: 1000000}),
    //     faker.date.anytime(),
    //     faker.helpers.arrayElement(['cancellation', 'issuance', 'retirement']),
    //     faker.date.past({years:20}).getFullYear(),
    // ])

    await pool.execute(query,[
        faker.helpers.arrayElement(['VCS005', 'GS004']),
        faker.number.int({min:0, max: 1000000}),
        faker.date.anytime(),
        faker.helpers.arrayElement(['cancellation', 'issuance', 'retirement']),
        faker.date.past({years:20}).getFullYear(),
    ])
}