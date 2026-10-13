require('dotenv').config();
const express=require('express');
const {Pool}=require('pg');

//const variableque no cambia
const app = express()

//permite recibir json
app.use(express.json());

//archivos html, css, y js
app.use(express.static('public'));
const pool=new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:{
        rejectUnauthorized:false
    }
})

app.listen(process.env.PORT||3000,()=>{
    console.log('servidor iniciado en http://localhost:' + process.env.PORT)
})