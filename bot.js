process.env["BOT_TOKEN"] = "2100982315:AAF3bkoBudsHuno5p7YKc0qs4ORtBB_nQrE"; // test bot key
const channelName = "qvalivetestchannel"; //  TestChannel
const channelID = "-1001699259987"; // TestChannel

// const channelName = "qvalive"; // OriginalChannel
// const channelID = "-1001762987728";  //  OriginalChannel

const {Bot, session, Keyboard, InlineKeyboard, GrammyError, HttpError} = require('grammy');
const bot = new Bot(process.env.BOT_TOKEN);
const moment = require('moment');
const Crawler = require("crawler");
const cron = require("node-cron");
const axios = require("axios");
moment.locale('es');

var qvalive_url = 'https://t.me/s/'+channelName+'?q=' + moment().subtract(5, 'hours').format('DDMMYYYY');
var publication_list = {};

const mainKeyboard = new InlineKeyboard()
    .text("✏️ Título*", "set_title").text("🗒 Descripción", "set_desc").text("🖼 Portada", "set_cover").row()
    .text("💠️ Espacio", "set_space").text("*️⃣ Temporada", "set_season").text("#️⃣ Capítulo", "set_episode").row()
    .text("🗓 Fecha*", "set_date").text("⏱ Hora*", "set_time").text("📢 Via", "set_channel").row()
    .text("👤 Anfitrión", "set_host").text("🗣 Invitado", "set_guest").text("🔗 Link", "set_link").row()
    .text("❌ Cancelar", "set_cancel").text("🚀 Listo", "set_ready").row();

// -------------post - functions ---------------------------

const confirmKeyboard = new InlineKeyboard().text("⬅️ Ir Atras", "set_back").text("🚀 Publicar", "set_launch").row();

bot.use(session({
    initial() {
        return {};
    }
}));

bot.command('start', (ctx) => {
    if (ctx.chat.id == channelID) return;

    ctx.session = {};
    ctx.reply(welcomen_message(ctx));
});

bot.command('comenzar', (ctx) => {
    if (ctx.chat.id == channelID) return;

    ctx.session = {state: 'title', item: {}};
    ctx.reply('Ingresa el título de la publicación:');
});

bot.command('cancelar', (ctx) => {
    if (ctx.chat.id == channelID) return;

    ctx.session = {};
    ctx.reply(welcomen_message(ctx));
});

bot.command('faq', (ctx) => {
    if (ctx.chat.id == channelID) return;

    ctx.reply(faq_message(ctx), {disable_web_page_preview: true});
    ctx.reply(welcomen_message(ctx));
});

bot.command('terminos', (ctx) => {
    if (ctx.chat.id == channelID) return;

    ctx.reply(rules_message(ctx));
    ctx.reply(welcomen_message(ctx));
});

bot.command('borrar', (ctx) => {
    if (ctx.chat.id == channelID) return;

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
            ctx.session.item[ctx.session.state] = capitalizeFirstLetter(moment(ctx.message.text, 'DD/MM/YYYY').format('ddd DD / MMM'));
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

bot.hears(/(.+)/, (ctx) => {
    if (ctx.chat.id == channelID) {
        qvalive_url = 'https://t.me/s/'+channelName+'?q=' +moment().subtract(5, 'hours').format('ddd DD / MMM');
        webListUpdater.queue(qvalive_url);
        return;
    }
});

const webListUpdater = new Crawler({
    maxConnections: 5,
    callback: function (error, res, done) {
        if (error) {
            console.log(error);
        } else {
            publication_list = creating_publication_list(res);
            const response = axios.post('https://getpantry.cloud/apiv1/pantry/dc2f73ce-3680-45cd-b910-d6c5e912ddfd/basket/qvalive_publication_list', array_to_obj(publication_list));
        }
        done();
    }
});


bot.callbackQuery("set_title", async (ctx) => remove_main_and_request_input(ctx, "title", 'Introduzca el título de la publicación'));
bot.callbackQuery("set_desc", async (ctx) => remove_main_and_request_input(ctx, "desc", 'Introduzca la descripción de la publicación'));
bot.callbackQuery("set_theme", async (ctx) => remove_main_and_request_input(ctx, "theme", 'Introduzca la tema (utilice #)'));
bot.callbackQuery("set_link", async (ctx) => remove_main_and_request_input(ctx, "link", 'Introduzca el link de la publicación'));
bot.callbackQuery("set_date", async (ctx) => remove_main_and_request_input(ctx, "date", 'Introduzca la fecha de la publicación (Puede utilizar el formato que le resulte mas fácil: DD/MM/YYYY , DD/MM, DD-MM , entre otros )'));
bot.callbackQuery("set_time", async (ctx) => remove_main_and_request_input(ctx, "time", 'Introduzca la hora de la publicación (Utilice el formato: HH:mm)'));
bot.callbackQuery("set_space", async (ctx) => remove_main_and_request_input(ctx, "space", 'Introduzca el nombre del espacio'));
bot.callbackQuery("set_episode", async (ctx) => remove_main_and_request_input(ctx, "episode", 'Introduzca el número del episodio'));
bot.callbackQuery("set_season", async (ctx) => remove_main_and_request_input(ctx, "season", 'Introduzca el número de la temporada'));
bot.callbackQuery("set_host", async (ctx) => remove_main_and_request_input(ctx, "host", 'Introduzca el anfitrión de la publicación'));
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
        ctx.reply("🛑 Hay campos requeridos (*) sin rellenar o valores invalidos.");
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
    if (ctx.session.item.date) message += '🗓 ' + ctx.session.item.date + '\n';
    if (ctx.session.item.time) message += '⏱ ' + ctx.session.item.time + '\n';
    if (ctx.session.item.host) message += '👤 Anf ' + ctx.session.item.host + '\n';
    if (ctx.session.item.guest) message += '🗣 Inv ' + ctx.session.item.guest + '\n';
    if (ctx.session.item.channel) message += '📢 Vía ' + ctx.session.item.channel + '\n';
    if (ctx.session.item.link) message += '🔗 ' + ctx.session.item.link + '\n';
    return message;
}

function render_main_menu(ctx) {
    let message = item_message(ctx)
    render_text_length_message(ctx);

    if (ctx.session.item.cover) {
        ctx.replyWithPhoto(ctx.session.item.cover, {
            caption: message,
            reply_markup: mainKeyboard,
            parse_mode: "HTML",
        });
    } else {
        ctx.reply(message, {
            reply_markup: mainKeyboard, parse_mode: "HTML",
        });
    }
}

function render_text_length_message(ctx) {
    let message = item_message(ctx)
    if (message.length > 280){
        ctx.reply("⚠️ Su mensaje excede los 280 caracteres ("+message.length+") por lo que en Twitter no sera mostrado completamente, puede publicarlo así o intentar reducir el contenido.");
    }
}

function render_release_menu(ctx) {
    ctx.api.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id);
    render_text_length_message(ctx);
    let message = item_message(ctx);
    if (ctx.session.item.cover) {
        ctx.replyWithPhoto(ctx.session.item.cover, {
            caption: message,
            reply_markup: confirmKeyboard,
            parse_mode: "HTML",
        });
    } else {
        ctx.reply(message, {
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
    return `Hola, este bot se encarga de crear nuevas publicaciones en la plataforma @QvaLive.\n\n🔸 Antes de comenzar lee los términos de uso  👉 /terminos \n\n🔸 Para crear tu publicación selecciona 👉 /comenzar \n\n🔸 Para ver preguntas frecuentes  👉 /faq`;
}

function faq_message(ctx) {
    return `
P: ¿Qué es QvaLive?
R: QvaLive es un espacio digital para difundir y fomentando el desarrollo e intercambio en espacios virtuales cubanos.

P: ¿Quién puede publicar en Qvalive?
R: Cualquier persona puede hacerlo siguiendo los /terminos y condiciones para realizar una publicación.

P: ¿Cuánto cuesta publicar en Qvalive?
R: Es totalmente gratis.

P: ¿Cuándo intento enviar mi publicación dice que tengo campos requeridos (*) sin rellenar. Que puedo hacer?
R: Para insertar una publicación la misma debe tener título, fecha y hora.

P: ¿Cómo puedo eliminar un campo que adicione por error?
R: Haga click sobre el campo que desea eliminar y seleccione o introduzca el comando /borrar

P: ¿Cómo puedo cancelar una publicación que ya no quiero enviar?
R: Intrudusca el comando /cancelar y se cancelara la publicación en curso.

P: ¿Dónde puedo revisar mis publicaciones?
R: Las publicaciones aparecen automáticamente en el canal @QvaLive y en el sitio web https://qvalive.com/ el dia de su emisión.

P: ¿Puedo crear una publicación fuera de Telegram?
R: Por ahora no, para esta versión inicial Qvalive solamente se gestiona desde Telegram.

P: ¿Puedo eliminar o modificar mediante el bot luego de insertar una publicación?
R: No, el bot solamente se encarga de insertar nuevas publicaciones.
    `;
}

function rules_message(ctx) {
    return `Términos y Condiciones de Uso de @QvaLive
    
*️⃣ Las transmisiones introducidas por los usuarios se muestran en los canales públicos y en la página web de QvaLive.

*️⃣ QvaLive no almacena ninguna información de los usuarios que crean las publicaciones.

*️⃣ QvaLive no se responsabiliza por los criterios que se emitan en las transmisiones.

*️⃣ QvaLive modera los comentarios realizados por los usuarios (palabras obscenas, insultos, entre otros) en caso de ser reportados, pero no se responsabiliza por los criterios u opiniones que emitan los mismos.

*️⃣ No se permiten las publicaciones referentes a:

❌ Temas violentos o de incitación a la violencia.
❌ Contenido pornográfico, violencia o explotación sexual.
❌ Organizaciones terroristas o delictivas.
❌ Spam.
❌ Actividades ilícitas o delictivas.
❌ Campañas u organizaciones políticas.
❌ Ataques a personas, grupos, entidades o gobiernos basándose en raza, etnicidad,  afiliación religiosa, afiliación política, nacionalidad, orientación sexual, sexo, género o identidad de género, discapacidades o enfermedades.

*️⃣ En caso de ser violados los términos anteriormente descritos, QvaLive se reserva el derecho de eliminar cualquier publicación o banear permanentemente al usuario.

Estos Términos y Condiciones fueron actualizados el 30/10/2021.`;
}

// Id del canal principal -1001762987728

function send_message(ctx) {
    if (ctx.session.item.cover) {
        ctx.api.sendPhoto("-741787409", ctx.session.item.cover, {caption: item_message(ctx), parse_mode: "HTML"});
    } else {
        ctx.api.sendMessage("-741787409", item_message(ctx), {parse_mode: "HTML", disable_web_page_preview: true});
    }
    ctx.api.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id);
    ctx.reply(
`Listo, tu publicación se completó satisfactoriamente, ahora sera moderada (Siempre en menos de 24h) y publicada en el canal @QvaLive.

Desde QvaLive te sugerimos utilizar la publicación del canal para compartirla con tu comunidad, de esta manera contribuimos entre todos al crecimiento de los proyectos incluidos en la plataforma (incluido el tuyo claro).`
    );
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
            bot.api.unpinAllChatMessages(channelID);
            if (publication_list.length != 0) {
                let message_promise = bot.api.sendPhoto(channelID, "https://i.ibb.co/m6Pg0YX/cartelera2.png", {
                    caption: message,
                    parse_mode: "Markdown",
                    disable_web_page_preview: true
                }).then(reply => {
                    bot.api.pinChatMessage(channelID, reply.message_id);
                });
            }
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
        item.title =  $(element).find('b').eq(1).text();
        let time = $(element).find('.tgme_widget_message_text').text().split('⏱ ')[1].substring(0, 8);
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
    var message = `*Cartelera @QvaLive ${moment().format('dddd DD [de] MMMM')}*\n\n`;
    arr.forEach(function (item) {
        message += `🎙 *${item.time.format('hh:mm A')}* | [${item.title}](${item.post}) \n\n`;
    });
    return message;
}

// -------------cron job ---------------------------

cron.schedule('0 12 * * *', () => {
    qvalive_url = 'https://t.me/s/'+channelName+'?q=' + moment().format('ddd DD MMM');
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