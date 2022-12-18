export default {
    db: {
        port: 3306,                         // SQL server port
        ip: "127.0.0.1",                    // SQL server IP
        user: "ragnarok",                     // SQL server username
        password: "ragnarok",           // SQL server password
        database: "ragnarok"                  // SQL database
    },
    web: {
        port: 82,                           // Web server port
        change_emblem_woe: true,            // Allow upload emblems during woe
        bmp_emblem_transparency_limit: 80,  // Allow BMP emblems with transparency up to this limit (in %)
        gif_emblem_transparency_limit: 80  // Allow GIF emblems with transparency up to this limit (in %)
    }
}
