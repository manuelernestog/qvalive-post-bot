const {Bot, session, Keyboard, InlineKeyboard, GrammyError, HttpError} = require('grammy');
const bot = new Bot(process.env.BOT_TOKEN);
const moment = require('moment');
const Crawler = require("crawler");
const cron = require("node-cron");
const axios = require("axios");
moment.locale('es');

let qvalive_url = 'https://t.me/s/qvalive?q=' + moment().format('DDMMYYYY');
var publication_list = {};

const mainKeyboard = new InlineKeyboard()
    .text("✏️ Titulo*", "set_title").text("🗒 Descripcion", "set_desc").text("🖼 Portada", "set_cover").row()
    .text("💠️ Espacio", "set_space").text("*️⃣ Temporada", "set_season").text("#️⃣ Capitulo", "set_episode").row()
    .text("📘 Tema", "set_theme").text("🗓 Fecha*", "set_date").text("⏱ Hora*", "set_time").row()
    .text("👤 Anfitrion", "set_host").text("🗣 Invitado", "set_guest").text("👥 Grupo", "set_group").row()
    .text("📢 Canal", "set_channel").text("🌐 Plataforma", "set_platform").text("🔗 Link", "set_link").row()
    .text("❌ Cancelar", "set_cancel").text("🚀 Listo", "set_ready").row();

// -------------post - functions ---------------------------

const confirmKeyboard = new InlineKeyboard().text("⬅️ Ir Atras", "set_back").text("🚀 Publicar", "set_launch").row();

bot.use(session({
    initial() {
        return {};
    }
}));

bot.command('start', (ctx) => {
    if (ctx.chat.id == "-1001762987728") return;

    ctx.session = {};
    ctx.reply(welcomen_message(ctx));
});

bot.command('comenzar', (ctx) => {
    if (ctx.chat.id == "-1001762987728") return;

    ctx.session = {state: 'title', item: {}};
    ctx.reply('Ingresa el título de la publicacion:');
});

bot.command('cancelar', (ctx) => {
    if (ctx.chat.id == "-1001762987728") return;

    ctx.session = {};
    ctx.reply(welcomen_message(ctx));
});

bot.command('faq', (ctx) => {
    if (ctx.chat.id == "-1001762987728") return;

    ctx.reply(faq_message(ctx));
    ctx.reply(welcomen_message(ctx));
});

bot.command('terminos', (ctx) => {
    if (ctx.chat.id == "-1001762987728") return;

    ctx.reply(rules_message(ctx));
    ctx.reply(welcomen_message(ctx));
});

bot.command('borrar', (ctx) => {
    if (ctx.chat.id == "-1001762987728") return;

    if (ctx.session.state != 'home') {
        delete ctx.session.item[ctx.session.state];
        ctx.session.state = 'home';
        render_main_menu(ctx);
    }
});

bot.on('message:text', (ctx) => {
    if (Object.keys(ctx.session).length === 0) return

    switch (ctx.session.state) {
        case 'date':
            ctx.session.item[ctx.session.state] = capitalizeFirstLetter(moment(ctx.message.text, 'DD/MM/YYYY').format('dddd, DD [de] MMMM [de] YYYY'));
            ctx.session.item["id"] = moment(ctx.message.text, 'DD/MM/YYYY').format('DDMMYYYY');
            break;
        case 'time':
            ctx.session.item[ctx.session.state] = moment(ctx.message.text, 'HH:mm').format('hh:mm A');
            break;
        default:
            ctx.session.item[ctx.session.state] = ctx.message.text;
    }
    ctx.session.state = 'home';
    render_main_menu(ctx);
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

bot.on('message:photo', (ctx) => {
    if (ctx.session == {}) return;

    if (ctx.session.state == 'cover') {
        ctx.session.item[ctx.session.state] = ctx.msg.photo[ctx.msg.photo.length - 1].file_id;
        ctx.replyWithPhoto(ctx.session.item.cover, {
            caption: item_message(ctx),
            reply_markup: mainKeyboard,
            parse_mode: "HTML",
        });
    }
    ctx.session.state = 'home';
});

bot.callbackQuery("set_title", async (ctx) => remove_main_and_request_input(ctx, "title", 'Introduzca el título de la publicación'));
bot.callbackQuery("set_desc", async (ctx) => remove_main_and_request_input(ctx, "desc", 'Introduzca la descripcion de la publicación'));
bot.callbackQuery("set_theme", async (ctx) => remove_main_and_request_input(ctx, "theme", 'Introduzca la tema (utilice #)'));
bot.callbackQuery("set_link", async (ctx) => remove_main_and_request_input(ctx, "link", 'Introduzca el link de la publicación'));
bot.callbackQuery("set_date", async (ctx) => remove_main_and_request_input(ctx, "date", 'Introduzca la fecha de la publicación (Puede utilizar el formato que le resulte mas facil: DD/MM/YYYY , DD/MM, DD-MM , entre otros )'));
bot.callbackQuery("set_time", async (ctx) => remove_main_and_request_input(ctx, "time", 'Introduzca la hora de la publicación (Utilice el formato: HH:mm)'));
bot.callbackQuery("set_space", async (ctx) => remove_main_and_request_input(ctx, "space", 'Introduzca el nombre del espacio'));
bot.callbackQuery("set_episode", async (ctx) => remove_main_and_request_input(ctx, "episode", 'Introduzca el numero del episodio'));
bot.callbackQuery("set_season", async (ctx) => remove_main_and_request_input(ctx, "season", 'Introduzca el numero de la temporada'));
bot.callbackQuery("set_host", async (ctx) => remove_main_and_request_input(ctx, "host", 'Introduzca el anfitrion de la publicación'));
bot.callbackQuery("set_guest", async (ctx) => remove_main_and_request_input(ctx, "guest", 'Introduzca el invitado de la publicación'));
bot.callbackQuery("set_platform", async (ctx) => remove_main_and_request_input(ctx, "platform", 'Introduzca la plataforma de la publicación'));
bot.callbackQuery("set_group", async (ctx) => remove_main_and_request_input(ctx, "group", 'Introduzca el grupo de la publicación'));
bot.callbackQuery("set_channel", async (ctx) => remove_main_and_request_input(ctx, "channel", 'Introduzca el canal de la publicación'));
bot.callbackQuery("set_cover", async (ctx) => remove_main_and_request_input(ctx, "cover", 'Envie la imagen de la portada'));
bot.callbackQuery("set_cancel", async (ctx) => cancel_process(ctx));
bot.callbackQuery("set_back", async (ctx) => {
    ctx.api.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id);
    render_main_menu(ctx);
});
bot.callbackQuery("set_launch", async (ctx) => send_message(ctx));

bot.callbackQuery("set_ready", async (ctx) => {
    if (!ctx.session.item.title || !ctx.session.item.date || !ctx.session.item.time || ctx.session.item.date == 'Fecha inválida' || ctx.session.item.time == 'Fecha inválida') {
        ctx.api.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id);
        ctx.reply("Tiene campos requeridos (*) sin rellenar o valores invalidos.");
        render_main_menu(ctx);
    } else {
        render_release_menu(ctx);
    }
});

function remove_main_and_request_input(ctx, state, request_message) {
    ctx.api.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id);
    ctx.reply(request_message);
    ctx.session.state = state;
}

function item_message(ctx) {
    let message = '';

    message += '🎙 <b>';
    if (ctx.session.item.space) {
        message += ctx.session.item.space;
        if (ctx.session.item.season || ctx.session.item.episode) {
            message += ' ';
            if (ctx.session.item.season) message += ctx.session.item.season + 'x';
            if (ctx.session.item.episode) message += ctx.session.item.episode;
        }
        message += " - "
    }
    if (ctx.session.item.title) message += ctx.session.item.title;
    message += '</b>\n\n';

    if (ctx.session.item.desc) message += ctx.session.item.desc + '\n\n';
    if (ctx.session.item.theme) message += '📘 Tema: ' + ctx.session.item.theme + '\n';
    if (ctx.session.item.date) message += '🗓 Fecha: ' + ctx.session.item.date + '\n';
    if (ctx.session.item.time) message += '⏱ Hora: ' + ctx.session.item.time + '\n';
    if (ctx.session.item.host) message += '👤 Anfitrion: ' + ctx.session.item.host + '\n';
    if (ctx.session.item.guest) message += '🗣 Invitado(s): ' + ctx.session.item.guest + '\n';
    if (ctx.session.item.group) message += '👥 Grupo: ' + ctx.session.item.group + '\n';
    if (ctx.session.item.channel) message += '📢 Canal: ' + ctx.session.item.channel + '\n';
    if (ctx.session.item.platform) message += '🌐 Plataforma: ' + ctx.session.item.platform + '\n';
    if (ctx.session.item.date) message += '#️⃣ ID: [' + ctx.session.item.id + ']\n';
    if (ctx.session.item.link) message += '\n🔗 Link: ' + ctx.session.item.link + '\n';
    return message;
}

function render_main_menu(ctx) {
    if (ctx.session.item.cover) {
        ctx.replyWithPhoto(ctx.session.item.cover, {
            caption: item_message(ctx),
            reply_markup: mainKeyboard,
            parse_mode: "HTML",
        });
    } else {
        ctx.reply(item_message(ctx), {
            reply_markup: mainKeyboard, parse_mode: "HTML",
        });
    }
}

function render_release_menu(ctx) {
    ctx.api.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id);
    if (ctx.session.item.cover) {
        ctx.replyWithPhoto(ctx.session.item.cover, {
            caption: item_message(ctx),
            reply_markup: confirmKeyboard,
            parse_mode: "HTML",
        });
    } else {
        ctx.reply(item_message(ctx), {
            reply_markup: confirmKeyboard,
            parse_mode: "HTML",
        });
    }
}

function cancel_process(ctx) {
    ctx.api.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id);
    ctx.session = {};
    ctx.reply(welcomen_message(ctx));
}

function welcomen_message(ctx) {
    return `Hola ${ctx.msg.chat.first_name}, este bot se encarga de crear nuevas publicaciones en la plataforma @QvaLive.\n\n🔸 Antes de comenzar lee los terminos de uso  👉 /terminos \n\n🔸 Para crear tu publicación selecciona 👉 /comenzar \n\n🔸 Para ver preguntas frecuentes  👉 /faq`;
}

function faq_message(ctx) {
    return `\n\n Este proyecto solamente se encarga de facilitar el acceso,la visualizacion y el crecimiento de las transimiciones que se realizan en Cuba.`;
}

function rules_message(ctx) {
    return `Términos y Condiciones de Uso de @QvaLive\n
*️⃣ Las transmiciones introducidas por los usuarios se muestran en un canal publico y en la pagina web de QvaLive.
*️⃣ QvaLive no almacena ninguna información de los usuarios que crean las publicaciones.
*️⃣ QvaLive no se responsabiliza por los criterios que se emitan en las transmiciones.
*️⃣ QvaLive modera los comentarios realizados por los usuarios (palabras obsenas, insultos, entre otros) en caso de ser reportados, pero no se responsailiza por los criteros u opiniones que emitan los mismos.
*️⃣ No se permite la publicacion en la plataforma de referentes a:
❌ Temas violentos o de incitacion a la violencia.
❌ Contenido Pornografico, violencia o explotación sexual.
❌ Organizaciones terroristas o delictivas.
❌ Actividades ilicitas o delictivas.
❌ Amenazas y mensajes de odio a usuarios de la plataforma o figuras públicas.
❌ Ataques a personas, grupos, entidades o gobiernos basándose en raza, etnicidad, afiliación política, afiliación religiosa, nacionalidad, orientación sexual, sexo, género o identidad de género, discapacidades o enfermedades.
*️⃣ En caso de ser violados los terminos anteriormente descritos, QvaLive se reserva el derecho de eliminar cualquier publicación o banear permanenete al usuario de la plataforma .

Estos Términos y Condiciones fueron actualizados el 30/10/2021.`;
}



function send_message(ctx) {
    if (ctx.session.item.cover) {
        ctx.api.sendPhoto("-1001762987728", ctx.session.item.cover, {caption: item_message(ctx), parse_mode: "HTML"});
    } else {
        ctx.api.sendMessage("-1001762987728", item_message(ctx), {parse_mode: "HTML", disable_web_page_preview: true});
    }
    ctx.api.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id);
    ctx.reply('Listo, tu publicación se completó satisfactoriamente, puedes verla en @QvaLive');
    ctx.session = {};
    ctx.reply(welcomen_message(ctx));
}

// -------------crawler - list ---------------------------

const craw = new Crawler({
    maxConnections: 5,
    callback: function (error, res, done) {
        if (error) {
            console.log(error);
        } else {
            publication_list = creating_publication_list(res);
            const response = axios.post('https://getpantry.cloud/apiv1/pantry/dc2f73ce-3680-45cd-b910-d6c5e912ddfd/basket/qvalive_publication_list', array_to_obj(publication_list));
            let message = generate_message(publication_list);
            let message_promise = bot.api.sendPhoto("-1001762987728", "https://i.ibb.co/XCy0LL7/cartelera.png", {
                caption: message,
                parse_mode: "Markdown",
                disable_web_page_preview: true
            }).then(reply => {
                bot.api.unpinAllChatMessages("-1001762987728");
                bot.api.pinChatMessage("-1001762987728", reply.message_id);
            })
        }
        done();
    }
});

function creating_publication_list(res) {
    var $ = res.$;
    var publication_array = [];
    $(".tgme_widget_message").each(function (index, element) {
        let item = {};
        item.post = 'https://t.me/' + $(element).attr('data-post');
        item.title = $(element).find('b').text().match(/[0-9a-zA-Z+@!();:óíáéú?=,$%*\-\s\.\#\/\,]+/g)[0];
        let time = $(element).find('.tgme_widget_message_text').text().split('Hora: ')[1].substring(0, 8);
        item.time = moment(time, 'hh:mm A');
        publication_array.push(item);
    });
    return reorder_array(publication_array);
}

function reorder_array(arr) {
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < (arr.length - i - 1); j++) {
            if (arr[j].time > arr[j + 1].time) {
                var temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}

function array_to_obj(array) {
    var obj = {};
    array.forEach(function (item, index) {
        obj[index] = item;
    });
    return obj;
}

function generate_message(arr) {
    var message = `*Cartelera @QvaLive ${moment().format('dddd, DD [de] MMMM [de] YYYY')}*\n\n`;
    arr.forEach(function (item) {
        message += `🎙 *${item.time.format('hh:mm A')}* | [${item.title}](${item.post}) \n\n`;
    });
    if (arr.length === 0) {
        message += `🗓 NO HAY NINGUNA TRANSMICION PROGRAMADA PARA HOY.`;
    }
    return message;
}

// -------------cron job ---------------------------

cron.schedule('0 11 * * *', () => {
    craw.queue(qvalive_url);
});

// -------------bot - handler ---------------------------

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
    ctx.reply('Ocurrió un error inesperado.');
    ctx.session = {};
    ctx.reply(welcomen_message(ctx));
});

// -------------staring server---------------------------
bot.start();