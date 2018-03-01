var bsurl = require('../../../utils/bsurl.js');
var common = require('../../../utils/util.js');
var async = require("../../../utils/async.js");
var nt = require("../../../utils/nt.js")
var app = getApp();
Page({
    data: {
        rec: {
            idx: 0, loading: false,
        },
        music: {},
        playing: false,
        playtype: {},
        banner: [6],
        thisday: (new Date()).getDate(),
        cateisShow: false,
        playlist: {
            idx: 1, loading: false,
            list: {},
            offset: 0,
            limit: 20
        },
        catelist: {
            res: {},
            checked: {
                name:"全部"
            }
        },
        djlist: {
            idx: 2, loading: false,
            list: [],
            offset: 0,
            limit: 20
        },
        djcate: { loading: false },
        djrecs: {},
        sort: {
            idx: 3, loading: false
        },
        tabidx: 0
    },
    toggleplay: function () {
        common.toggleplay(this, app);
    },
    playnext: function (e) {
        app.nextplay(e.currentTarget.dataset.pt)
    },
    music_next: function (r) {
        this.setData({
            music: r.music,
            playtype: r.playtype
        })
    },
    music_toggle: function (r) {
        this.setData({
            playing: r.playing
        })
    },
    onLoad: function (options) {
        if (options.share == 1) {
            var url = '../' + options.st + '/index?id=' + options.id
            wx.navigateTo({
                url: url,
                success: function () {
                }
            })
            return;
        };
    },
    onHide: function () {
        nt.removeNotification("music_next", this)
        nt.removeNotification("music_toggle", this)
    },
    onShow: function () {
        nt.addNotification("music_next", this.music_next, this);
        nt.addNotification("music_toggle", this.music_toggle, this)
        this.setData({
            music: app.globalData.curplay,
            playing: app.globalData.playing,
            playtype: app.globalData.playtype,
        })
        if (!wx.getStorageSync('user')) {
            wx.redirectTo({
                url: '../login/index'
            });
            return;
        }
        !this.data.rec.loading && this.init();
    },
    switchtab: function (e) {
        var that = this;
        var t = e.currentTarget.dataset.t;
        this.setData({ tabidx: t });
        if (t == 1 && !this.data.playlist.loading) {
            this.gplaylist()
        }
        if (t == 2 && !this.data.sort.loading) {
            this.data.sort.loading = false;
            this.setData({
                sort: this.data.sort
            });
            wx.request({
                url: bsurl + 'getTopPlayLists',
                success: function (res) {
                    res.data.idx = 3;
                    res.data.loading = true;
                    that.setData({
                        sort: res.data
                    });
                    console.log(res.data);
                }
            })
        }

    },
    gdjlist: function (isadd) {
        var that = this;
        var that = this;
        wx.request({
            url: bsurl + 'djradio/hot',
            data: {
                limit: that.data.djlist.limit,
                offset: that.data.djlist.offset
            },
            complete: function (res) {
                that.data.djlist.loading = true;
                if (!isadd) {
                    that.data.djlist.list = res.data
                } else {
                    res.data.djRadios = that.data.djlist.list.djRadios.concat(res.data.djRadios);
                    that.data.djlist.list = res.data
                }
                that.data.djlist.offset += res.data.djRadios.length;
                that.setData({
                    djlist: that.data.djlist
                })
            }
        })
    },
    gplaylist: function (isadd) {
        //分类歌单列表
        var that = this;
        wx.request({
            url: bsurl + 'recommendPlayLists/offset/' + that.data.playlist.offset + '/limit/' + that.data.playlist.limit + '/type/' + that.data.catelist.checked.name,
            complete: function (res) {
                that.data.playlist.loading = true;
                if (!isadd) {
                    that.data.playlist.list = res.data
                } else {
                    res.data = that.data.playlist.list.concat(res.data);
                    that.data.playlist.list = res.data
                }
                that.data.playlist.offset += res.data.length;
                that.setData({
                    playlist: that.data.playlist
                })
                // console.log(that.data.playlist.list );
            }
        });
    },
    onReachBottom: function () {
        if (this.data.tabidx == 1) {
            this.gplaylist(1);//更多歌单
        }
        // else if (this.data.tabidx == 2) {
        //     this.gdjlist(1);//更多dj节目
        // }
    },
    togglePtype: function () {
        this.setData({
            cateisShow: !this.data.cateisShow
        })
    },
    cateselect: function (e) {
        var t = e.currentTarget.dataset.catype;
        this.data.catelist.checked = t
        this.setData({
            playlist: {
                idx: 1,
                loading: false,
                list: {},
                offset: 0,
                limit: 20
            },
            cateisShow: !this.data.cateisShow,
            catelist: this.data.catelist
        });
        this.gplaylist();
    },

    init: function () {
        var that = this
        var rec = this.data.rec
        //banner，
        wx.request({
            url: bsurl + 'getBanner',
            data: { cookie: app.globalData.cookie },
            success: function (res) {
                that.setData({
                    banner: res.data
                })
            }
        });
        wx.request({
            url: bsurl + 'getTagLists',
            complete: function (res) {
                that.setData({
                    catelist: {
                        isShow: false,
                        res: res.data,
                        checked: res.data.all
                    }
                })
            }
        })
        //个性推荐内容,歌单，新歌，mv，电台
        async.map(['recommendPlayList', 'getRecommendMusics', 'recommendMV'], function (item, callback) {
            wx.request({
                url: bsurl + item,
                data: { cookie: app.globalData.cookie },
                success: function (res) {
                    callback(null, res.data)
                }
            })
        }, function (err, results) {
            rec.loading = true;
            rec.re = results
            that.setData({
                rec: rec
            })
        });
    }
})