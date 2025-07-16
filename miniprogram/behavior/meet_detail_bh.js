const cloudHelper = require('../helper/cloud_helper.js');
const pageHelper = require('../helper/page_helper.js');
const AdminMeetBiz = require('../biz/admin_meet_biz.js');
const MeetBiz = require('../biz/meet_biz.js');
const setting = require('../setting/setting.js');
const timeHelper = require('../helper/time_helper.js');

module.exports = Behavior({

	/**
	 * 页面的初始数据
	 */
	data: {
		isLoad: false,


		tabCur: 0,
		mainCur: 0,
		verticalNavTop: 0,

		showMind: true,
		showTime: false,
	},
	methods: {
		/**
		 * 生命周期函数--监听页面加载
		 */
		onLoad: function (options) {
			if (!pageHelper.getOptions(this, options)) return;

			this._loadDetail();
		},

		_loadDetail: async function () {
			let id = this.data.id;
			if (!id) return;

			let params = {
				id,
			};
			let opt = {
				title: 'bar'
			};
			let meet = await cloudHelper.callCloudData('meet/view', params, opt);
			if (!meet) {
				this.setData({
					isLoad: null
				})
				return;
			}

			// 获取可预约日期信息
			let hasDaysParams = {
				day: timeHelper.time('Y-M-D')
			};
			let hasDaysData = await cloudHelper.callCloudData('meet/list_has_day', hasDaysParams, opt);
			
			// 为详情页的日期添加可预约状态
			if (meet.MEET_DAYS_SET && meet.MEET_DAYS_SET.length > 0 && hasDaysData && hasDaysData.length > 0) {
				for (let i = 0; i < meet.MEET_DAYS_SET.length; i++) {
					let daySet = meet.MEET_DAYS_SET[i];
					// 查找该日期是否在可预约列表中
					let canBook = false;
					for (let j = 0; j < hasDaysData.length; j++) {
						if (hasDaysData[j].day === daySet.day) {
							canBook = hasDaysData[j].canBook;
							break;
						}
					}
					daySet.canBook = canBook;
					
					// 如果不可预约，为所有时段添加错误信息
					if (!canBook) {
						for (let k = 0; k < daySet.times.length; k++) {
							if (!daySet.times[k].error) {
								daySet.times[k].error = '暂不可预约';
							}
						}
					}
				}
			}

			this.setData({
				isLoad: true,
				meet, 
				canNullTime: setting.MEET_CAN_NULL_TIME
			});

		},

		/**
		 * 生命周期函数--监听页面初次渲染完成
		 */
		onReady: function () {

		},

		/**
		 * 生命周期函数--监听页面显示
		 */
		onShow: function () {

		},

		/**
		 * 生命周期函数--监听页面隐藏
		 */
		onHide: function () {

		},

		/**
		 * 生命周期函数--监听页面卸载
		 */
		onUnload: function () {

		},

		/**
		 * 页面相关事件处理函数--监听用户下拉动作
		 */
		onPullDownRefresh: async function () {
			await this._loadDetail();
			wx.stopPullDownRefresh();
		},

		/**
		 * 页面上拉触底事件的处理函数
		 */
		onReachBottom: function () {

		},

		/**
		 * 用户点击右上角分享
		 */
		onShareAppMessage: function () {

		},

		bindJoinTap: async function (e) {
			let dayIdx = pageHelper.dataset(e, 'dayidx');
			let timeIdx = pageHelper.dataset(e, 'timeidx');

			let time = this.data.meet.MEET_DAYS_SET[dayIdx].times[timeIdx];

			if (time.error) {
				if (time.error.includes('暂不可预约')) {
					return pageHelper.showModal('该日期不可预约，请选择最近7个可预约日期');
				} else if (time.error.includes('预约')) {
					return pageHelper.showModal('该时段' + time.error + '，换一个时段试试吧！');
				} else {
					return pageHelper.showModal('该时段预约' + time.error + '，换一个时段试试吧！');
				}
			}

			let meetId = this.data.id;
			let timeMark = time.mark;

			let callback = async () => {
				try {
					let opts = {
						title: '请稍候',
					}
					let params = {
						meetId,
						timeMark
					}
					await cloudHelper.callCloudSumbit('meet/before_join', params, opts).then(res => {
						wx.navigateTo({
							url: `../join/meet_join?id=${meetId}&timeMark=${timeMark}`,
						})
					});
				} catch (ex) {
					console.log(ex);
				}
			}
			MeetBiz.subscribeMessageMeet(callback);

		},

		url: function (e) {
			pageHelper.url(e, this);
		},

		onPageScroll: function (e) {
			console.log(111)
			if (e.scrollTop > 100) {
				this.setData({
					topShow: true
				});
			} else {
				this.setData({
					topShow: false
				});
			}
		},

		bindTopTap: function () {
			wx.pageScrollTo({
				scrollTop: 0
			})
		},

		bindVerticalMainScroll: function (e) {
			if (!this.data.isLoad) return;

			let list = this.data.meet.MEET_DAYS_SET;
			let tabHeight = 0;

			for (let i = 0; i < list.length; i++) {
				let view = wx.createSelectorQuery().in(this).select("#main-" + i);
				view.fields({
					size: true
				}, data => {
					list[i].top = tabHeight;
					tabHeight = tabHeight + data.height;
					list[i].bottom = tabHeight;
				}).exec();
			}

			let scrollTop = e.detail.scrollTop + 20; // + i*0.5; //TODO
			for (let i = 0; i < list.length; i++) {

				if (scrollTop > list[i].top && scrollTop < list[i].bottom) {

					this.setData({
						verticalNavTop: (i - 1) * 50,
						tabCur: i
					})
					return false;
				}
			}
		},

		bindTabSelectTap: function (e) {
			let idx = pageHelper.dataset(e, 'idx');
			this.setData({
				tabCur: idx,
				mainCur: idx,
				verticalNavTop: (idx - 1) * 50
			})
		},

		bindShowMindTap: function (e) {
			this.setData({
				showMind: true,
				showTime: false
			});
		},

		bindShowTimeTap: function (e) {
			this.setData({
				showMind: false,
				showTime: true
			});
		}
	}
})