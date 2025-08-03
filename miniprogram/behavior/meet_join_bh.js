const cloudHelper = require('../helper/cloud_helper.js');
const pageHelper = require('../helper/page_helper.js');
const setting = require('../setting/setting.js');
const MeetBiz = require('../biz/meet_biz.js');

module.exports = Behavior({

	/**
	 * 页面的初始数据
	 */
	data: {
		isLoad: false,

		// 携带人员相关数据
		carryTypeIndex: 3, // 携带人员类型索引，-1表示未选择
		carryTypeOptions: [
			{ value: 1, name: '亲属' },
			{ value: 2, name: '同事' },
			{ value: 3, name: '其他' },
			{ value: 0, name: '不携带' }
		],
		carryTypeNames: ['亲属', '同事', '其他', '不携带'], // 用于picker的range
		carryCountIndex: 0, // 携带人数索引，0表示选择1人，1表示选择2人
		carryCountOptions: [
			{ value: 1, name: '1人' },
			{ value: 2, name: '2人' },
			{ value: 3, name: '3人' },
			{ value: 4, name: '4人' },
			{ value: 5, name: '5人' }
		],
		carryCountNames: [], // 用于picker的range，动态生成1-40人
		carryCount: 1, // 携带人数，默认1人
		carryNames: [], // 携带人员姓名列表，默认空数组


	},

	methods: {
		/**
		 * 生命周期函数--监听页面加载
		 */
		onLoad: async function (options) {
			if (!pageHelper.getOptions(this, options)) return;
			if (!pageHelper.getOptions(this, options, 'timeMark')) return;

			// 生成1-40人的选项
			let carryCountNames = [];
			for (let i = 1; i <= 40; i++) {
				carryCountNames.push(i + '人');
			}
			console.log('生成的携带人数选项:', carryCountNames);
			this.setData({
				carryCountNames: carryCountNames
			});

			this._loadDetail();

		},

		_loadDetail: async function () {
			let id = this.data.id;
			if (!id) return;

			let timeMark = this.data.timeMark;
			if (!timeMark) return;

			let params = {
				meetId: id,
				timeMark
			};
			let opt = {
				title: 'bar'
			};
			let meet = await cloudHelper.callCloudData('meet/detail_for_join', params, opt);
			if (!meet) {
				this.setData({
					isLoad: null
				})
				return;
			}


			this.setData({
				isLoad: true,
				meet,
			});

		},

		/**
		 * 生命周期函数--监听页面初次渲染完成
		 */
		onReady: function () {},

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



		url: function (e) {
			pageHelper.url(e, this);
		},

		onPageScroll: function (e) {
			// 回页首按钮
			pageHelper.showTopBtn(e, this);

		},

		// 携带人员类型选择
		bindCarryTypeChange: function (e) {
			let index = parseInt(e.detail.value);
			let carryType = this.data.carryTypeOptions[index].value;
			
			this.setData({
				carryTypeIndex: index
			});
			
			console.log('carryTypeIndexcarryTypeIndex', this.data.carryTypeIndex);
			
			// 如果选择"不携带"（现在在索引3），清空携带人数相关数据
			if (index === 3) { // "不携带"在索引3
				this.setData({
					carryCountIndex: -1,
					carryCount: 0,
					carryNames: []
				});
			} else {
				// 如果选择携带人员类型（非"不携带"），默认设置携带人数为1
				this.setData({
					carryCountIndex: 0, // 选择"1人"
					carryCount: 1,
					carryNames: [''] // 默认1个空字符串
				});
			}
		},

		// 携带人数选择
		bindCarryCountChange: function (e) {
			let index = parseInt(e.detail.value); // 确保是数字类型
			let count = index + 1; // 因为索引从0开始，所以+1
			
			console.log('选择携带人数 - 索引:', index, '实际人数:', count, '选项数组:', this.data.carryCountNames);
			
			// 生成对应数量的姓名输入框
			let carryNames = [];
			for (let i = 0; i < count; i++) {
				carryNames.push('');
			}
			
			console.log('生成的姓名数组:', carryNames);
			
			this.setData({
				carryCountIndex: index,
				carryCount: count,
				carryNames: carryNames
			});
			
			console.log('设置后的数据:', {
				carryCountIndex: index,
				carryCount: count,
				carryNames: carryNames
			});
		},

		// 携带人员姓名输入
		bindCarryNameInput: function (e) {
			let index = parseInt(e.currentTarget.dataset.index);
			let value = e.detail.value;
			let carryNames = this.data.carryNames;
			
			console.log('姓名输入:', {
				index,
				value,
				carryNames: carryNames
			});
			
			carryNames[index] = value;
			
			console.log('更新后的姓名数组:', carryNames);
			
			this.setData({
				carryNames: carryNames
			});
		},

		bindCheckTap: async function (e) {
			// 验证携带人员信息
			if (!this._validateCarryInfo()) {
				return;
			}
			
			// 直接提交，不依赖表单组件
			this._submitForm();
		},

		// 验证携带人员信息
		_validateCarryInfo: function () {
			let carryTypeIndex = parseInt(this.data.carryTypeIndex); // 确保是数字
			let carryCount = parseInt(this.data.carryCount); // 确保是数字
			let carryNames = this.data.carryNames;
			
			console.log('验证携带人员信息:', {
				carryTypeIndex,
				carryCount,
				carryNames
			});
			
			// 检查是否选择了携带人员类型
			if (carryTypeIndex === -1) {
				wx.showToast({
					title: '请选择携带人员类型',
					icon: 'none'
				});
				return false;
			}
			
			// 如果选择了携带人员（非"不携带"，即索引0-2），检查携带人数
			if (carryTypeIndex >= 0 && carryTypeIndex <= 2 && carryCount === 0) {
				console.log('携带人数验证失败:', carryTypeIndex, carryCount);
				wx.showToast({
					title: '请选择携带人数',
					icon: 'none'
				});
				return false;
			}
			
			// 检查携带人员姓名是否填写完整
			if (carryCount > 0) {
				for (let i = 0; i < carryCount; i++) {
					if (!carryNames[i] || !carryNames[i].trim()) {
						wx.showToast({
							title: `请填写携带人员${i + 1}的姓名`,
							icon: 'none'
						});
						return false;
					}
				}
			}
			
			return true;
		},

		// 直接提交表单的方法
		_submitForm: async function () {
			let callback = async () => {
				try {
					let opts = {
						title: '提交中'
					}
					
					// 获取携带人员信息
					let carryType = 0;
					let carryCount = 0;
					let carryNames = [];
					
					if (this.data.carryTypeIndex >= 0) {
						carryType = this.data.carryTypeOptions[this.data.carryTypeIndex].value;
						carryCount = this.data.carryCount;
						carryNames = this.data.carryNames;
					}
					
					console.log('携带人员信息:', {
						carryTypeIndex: this.data.carryTypeIndex,
						carryType,
						carryCount,
						carryNames
					});
					
					// 获取当前用户信息
					let userDetail = await cloudHelper.callCloudData('passport/my_detail');
					
					if (!userDetail) {
						wx.showToast({
							title: '获取用户信息失败',
							icon: 'none'
						});
						return;
					}
					
					let userName = userDetail.USER_NAME;
					let userPhone = userDetail.USER_MOBILE;
					
					if (!userName || !userPhone) {
						wx.showToast({
							title: '用户信息不完整',
							icon: 'none'
						});
						return;
					}
					
					let params = {
						meetId: this.data.id,
						timeMark: this.data.timeMark,
						forms: [{
							mark: 'NAME',
							val: userName,
							title: '姓名',
							type: 'line'
						}, {
							mark: 'PHONE',
							val: userPhone,
							title: '手机号',
							type: 'line'
						}], // 使用当前用户信息
						carryType,
						carryCount,
						carryNames
					}
					
					console.log('提交的参数:', params);
					console.log('携带人员信息:', {
						carryType,
						carryCount,
						carryNames
					});
					await cloudHelper.callCloudSumbit('meet/join', params, opts).then(res => {
						let content = '预约成功！'

						let joinId = res.data.joinId;
						wx.showModal({
							title: '温馨提示',
							showCancel: false,
							content,
							success() {
								let ck = () => {
									wx.reLaunch({
										url: pageHelper.fmtURLByPID('/pages/my/join_detail/my_join_detail?flag=home&id=' + joinId),
									})
								}
								ck();
							}
						})
					})
				} catch (err) {
					console.log(err);
				};
			}

			// 直接执行回调，不需要消息订阅
			callback();
		}
	}
})