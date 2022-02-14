const express = require('express');
require('dotenv').config();
var bcrypt = require('bcryptjs');
const { dbConnection } = require('../database/config')
const Usuario = require('./usuario');
const Rol = require('./rol');
const bcryptjs = require('bcryptjs');
const { body, validationResult, check } = require('express-validator');

const port = process.env.PORT;
class Server {
    constructor() {
        this.app = express();
        this.conectarDB();
        this.middlewares();
        this.rutas();
    }
    middlewares() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }
    async conectarDB() {
        await dbConnection()
    }
    rutas() {
        this.app.get('/', function (req, res) {
            res.send('Hola IES JUAN BOSCO')
        })
        this.app.get('/api', async function (req, res) {
            let usuarios = await Usuario.find();
            res.status(403).json({
                ok: true,
                msg: 'get API',
                usuarios
            })
        })
        this.app.get('/suma', function (req, res) {
            const num1 = Number(req.query.num1);
            const num2 = Number(req.query.num2);
            res.send(`La suma de ${num1} y ${num2} es ${(num1) + (num2)}`)
        })

        this.app.post('/api',
            body('correo').isEmail(),
            check('nombre','El nombre es obligatorio').not().isEmpty(),
            check('password','El password debe tener almenos 6 caranteres').isLength({min:6}),
            //check('rol','El rol no es valido').isIn(['ADMIN_ROLE', 'USER_ROLE']),
            check('rol').custom(
                   async function(rol){
                        const existeRol = await Rol.findOne({rol});
                        if(!existeRol){
                            throw new Error(`El rol ${rol} no está en la base de datos`)
                        }
                    }
            ),
            check('correo').custom(
                async function(correo){
                     const existeCorreo = await Usuario.findOne({correo});
                     if(existeCorreo){
                         throw new Error(`El correo ${correo}  está en la base de datos`)
                     }
                 }
         ),
            function(req,res) {  
            const body = req.body;
                let usuario = new Usuario(body);
                //valida correo
                const erroresVal = validationResult(req);
                if(!erroresVal.isEmpty()){
                    return res.status(400).json({msg: erroresVal.array()})
                }
                //le hago hash a la contraseña
                const salt = bcryptjs.genSaltSync();
                usuario.password = bcryptjs.hashSync(usuario.password, salt);
                usuario.save();
                res.json({
                    ok: true,
                    msg: 'post API',
                    usuario
                })
            })
        this.app.put('/api/:id', async function (req, res) { //actualisa
            const id = req.params.id;
            let{password, ...resto} =req.body;
            //le hago hash a la contraseña
            const salt = bcryptjs.genSaltSync();
            password = bcryptjs.hashSync(password, salt);
            resto.password=password;
            await Usuario.findByIdAndUpdate(id, req.body);
            res.status(403).json({
                ok: true,
                msg: 'put API',
                id,
                resto
            })
        })
        this.app.delete('/api/:id', async function (req, res) {
            const id = req.params.id;
            await Usuario.findByIdAndDelete(id);
            res.status(403).json({
                ok: true,
                msg: 'delete API'
            })
        })
        this.app.get('/saludo', function (req, res) {
            res.send('<h1>Hola 2DAW</h1>')
        })
        this.app.get('*', function (req, res) {
            res.sendFile(__dirname + '/404.html')
        })
    }

    listen() {
        this.app.listen(port, function () {
            console.log('Escuchando el puerto', port)
        });
    }
}
module.exports = Server;