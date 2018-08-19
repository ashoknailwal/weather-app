const Hapi = require('hapi');
const Boom = require('boom');
const Hoek = require('hoek');
const Request = require('request');
const server = new Hapi.Server();
require('dotenv').config();
const port = process.env.PORT || 8081;


server.connection({
    port,
    host : 'localhost'
});

//adding templates using handlebars
server.register(require('vision'), (err)=>{
    Hoek.assert(!err, err);
    server.views({
        engines: {
            html: require('handlebars')
        },
        path: './templates'
    });
});


server.register(require('inert'),(err)=>{
    if(err)
        throw err;
    server.route({
        method: 'GET',
        path: '/',
        handler: function(req, reply){
            reply.view('index')
        }
    });
    server.route({
        method: 'POST',
        path: '/getTemp',
        handler: function(req,reply){
            Request.get(`http://api.openweathermap.org/data/2.5/forecast?q=${req.payload.city}&APPID=${process.env.APPID}`
              , function(err, response, body){
                if(err)
                    throw err;
                const data = JSON.parse(body);
                let tempCal;
                try{
                tempCal = Math.round((data.list[2].main.temp-273.15)*100)/100;
                }catch(error){
                    tempCal = null;
                }
                reply.view('index', {temperature: {temp: tempCal}});
            });
            
        }
    });
    server.route({
        method: ['GET','POST'],
        path: '/{any*}',
        handler: function(req, reply){
            let b = Boom.notFound("This resource is not available");
            reply.view('error',b);
        }
    })
});

server.ext("onRequest",(req,res)=>{
    console.log("Request recieved: "+req.path);
    res.continue();
})





server.start();