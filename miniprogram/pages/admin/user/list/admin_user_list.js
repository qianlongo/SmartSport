const AdminBiz = require('../../../../biz/admin_biz.js');
const pageHelper = require('../../../../helper/page_helper.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');


Page({

	/**
	 * 页面的初始数据
	 */
	data: {},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: async function (options) {
		if (!AdminBiz.isAdmin(this)) return;

		//设置搜索菜单
		await this._getSearchMenu();
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: async function () {},

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

	url: async function (e) {
		pageHelper.url(e, this);
	},

	// 导入导出选择
	bindImportExportTap: function (e) {
		let itemList = ['导入数据', '下载模板'];
		
		wx.showActionSheet({
			itemList,
			success: async res => {
				switch (res.tapIndex) {
					case 0: { //导入数据
						this.bindImportDataTap(e);
						break;
					}
					case 1: { //下载模板
						this.bindDownloadTemplateTap(e);
						break;
					}
				}
			},
			fail: function (res) {}
		})
	},

	bindImportDataTap: function (e) {
		wx.chooseMessageFile({
			count: 1,
			type: 'file',
			extension: ['xlsx', 'xls', 'csv'],
			success: async (res) => {
				let file = res.tempFiles[0];
				if (!file) {
					pageHelper.showModal('请选择Excel文件');
					return;
				}

				// 检查文件大小（限制为5MB）
				if (file.size > 20 * 1024 * 1024) {
					pageHelper.showModal('文件大小不能超过5MB，请选择较小的文件');
					return;
				}

				try {
					// 文件上传比较长时间
					wx.showLoading({
						title: '文件上传中...',
						mask: true
					});
					
					// 上传文件到云存储
					let uploadResult = await this.uploadFileToCloud(file.path, file.name);
					
					// 隐藏上传提示
					wx.hideLoading();
					
					// 显示数据导入提示
					wx.showLoading({
						title: '数据导入中...',
						mask: true
					});
					
					// 发送fileID到云函数解析
					let options = {
						title: '数据导入中'
					}

					console.log('uploadResult', uploadResult)

					let importResult = await cloudHelper.callCloudData('admin/internal_user_import', {
						fileID: uploadResult.fileID
					}, options);

					console.log('importResult', importResult)
					console.log('importResult.failCount:', importResult.failCount)
					console.log('importResult.errorReportUrl:', importResult.errorReportUrl)
					
					// 隐藏导入提示
					wx.hideLoading();

					if (importResult) {
						let message = '成功：' + importResult.successCount + '条，';
						message += '失败：' + importResult.failCount + '条';
						
						if (importResult.failCount > 0 && importResult.failList && importResult.failList.length > 0) {
							console.log('有失败记录，failCount:', importResult.failCount);
							// 有错误时，直接提供下载错误报告
							if (importResult.errorReportUrl) {
								console.log('有错误报告文件，errorReportUrl:', importResult.errorReportUrl);
								message += '，点击确认下载详细错误信息';
								console.log('准备显示modal，message:', message);
								wx.showModal({
									title: '导入完成',
									content: message,
									confirmText: '下载',
									cancelText: '关闭',
									success: (res) => {
										console.log('modal显示成功，用户选择:', res.confirm);
										if (res.confirm) {
											this.downloadErrorReport(importResult.errorReportUrl);
										}
									},
									fail: (err) => {
										console.log('modal显示失败:', err);
									}
								});
							} else {
								// 如果没有错误报告文件，显示简要信息
								pageHelper.showModal(message + '\n\n请检查数据格式后重新导入。');
							}
						} else {
							// 全部成功，显示成功提示
							pageHelper.showSuccToast(message);
						}
					} else {
						pageHelper.showModal('导入失败，请重试');
					}

				} catch (err) {
					console.log('导入失败', err);
					wx.hideLoading();
					pageHelper.showModal('导入失败：' + (err.message || '请重试'));
				}
			},
			fail: (err) => {
				console.log('选择文件失败', err);
				pageHelper.showModal('选择文件失败，请重试');
			}
		});
	},

	bindDownloadTemplateTap: async function (e) {
		try {
			let options = {
				title: '模板生成中'
			}

			let result = await cloudHelper.callCloudData('admin/internal_user_template', {}, options);
			
			if (result && result.url) {
				// 使用云开发API获取临时下载链接
				wx.cloud.getTempFileURL({
					fileList: [result.url],
					success: (res) => {
						if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
							let tempUrl = res.fileList[0].tempFileURL;
							
							// 复制链接到剪贴板
							wx.setClipboardData({
								data: tempUrl,
								success: () => {
									pageHelper.showModal('模板生成成功！\n\n下载链接已复制到剪贴板，请在浏览器中打开链接下载Excel模板文件。\n\n使用说明：\n1. 在浏览器中打开复制的链接\n2. 下载Excel模板文件\n3. 按照模板格式填写内部人员信息\n4. 通过"导入数据"功能上传填写好的文件');
								},
								fail: () => {
									pageHelper.showModal('模板生成成功！\n\n下载链接：' + tempUrl + '\n\n请复制此链接在浏览器中下载Excel模板文件。');
								}
							});
						} else {
							pageHelper.showModal('获取下载链接失败，请重试');
						}
					},
					fail: (err) => {
						console.log('获取临时链接失败', err);
						pageHelper.showModal('模板生成成功，但获取下载链接失败。\n\n文件地址：' + result.url + '\n\n请联系管理员获取文件。');
					}
				});
			} else {
				pageHelper.showModal('模板生成失败，请重试');
			}
		} catch (err) {
			console.log(err);
			pageHelper.showModal('模板生成失败，请重试');
		}
	},



	/** 上传文件到云存储 */
	uploadFileToCloud: function (filePath, fileName) {
		return new Promise((resolve, reject) => {
			// 生成云存储路径
			let cloudPath = 'excel_import/' + Date.now() + '_' + fileName;
			
			wx.cloud.uploadFile({
				cloudPath: cloudPath,
				filePath: filePath,
				success: (res) => {
					console.log('文件上传成功:', res);
					resolve(res);
				},
				fail: (err) => {
					console.log('文件上传失败:', err);
					reject(err);
				}
			});
		});
	},



	downloadErrorReport: function (fileID) {
		// 使用云开发API获取临时下载链接
		wx.cloud.getTempFileURL({
			fileList: [fileID],
			success: (res) => {
				if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
					let tempUrl = res.fileList[0].tempFileURL;
					
					// 复制链接到剪贴板
					wx.setClipboardData({
						data: tempUrl,
						success: () => {
							pageHelper.showModal('错误报告下载链接已复制到剪贴板！\n\n请在浏览器中打开链接下载Excel错误报告文件。\n\n错误报告包含所有导入失败的数据和具体原因。');
						},
						fail: () => {
							pageHelper.showModal('错误报告下载链接：' + tempUrl + '\n\n请复制此链接在浏览器中下载Excel错误报告文件。');
						}
					});
				} else {
					pageHelper.showModal('获取错误报告下载链接失败，请重试');
				}
			},
			fail: (err) => {
				console.log('获取临时链接失败', err);
				pageHelper.showModal('获取错误报告下载链接失败，请重试');
			}
		});
	},

	bindCommListCmpt: function (e) {
		pageHelper.commListListener(this, e);
	},

	bindDelTap: async function (e) {
		if (!AdminBiz.isAdmin(this)) return;
		let id = pageHelper.dataset(e, 'id');

		let params = {
			id
		}

		let callback = async () => {
			try {
				let opts = {
					title: '删除中'
				}
				await cloudHelper.callCloudSumbit('admin/user_del', params, opts).then(res => {
					
					pageHelper.delListNode(id, this.data.dataList.list, 'USER_MINI_OPENID');
					this.data.dataList.total--;
					this.setData({
						dataList: this.data.dataList
					});
					pageHelper.showSuccToast('删除成功');
				});
			} catch (e) {
				console.log(e);
			}
		}
		pageHelper.showConfirm('确认删除？删除不可恢复', callback);

	},

	bindStatusTap: async function (e) {
		if (!AdminBiz.isAdmin(this)) return;
		let id = pageHelper.dataset(e, 'id');
		let status = pageHelper.dataset(e, 'status');

		let params = {
			id,
			status
		}
		try {
			await cloudHelper.callCloudSumbit('admin/user_status', params).then(res => {
				pageHelper.modifyListNode(id, this.data.dataList.list, 'USER_STATUS', status, 'USER_MINI_OPENID');
				this.setData({
					dataList: this.data.dataList
				});
				pageHelper.showSuccToast('设置成功');
			});
		} catch (e) {
			console.log(e);
		}
	},

	_getSearchMenu: async function () {

		let sortItems = [];
		let sortMenus = [{
				label: '全部',
				type: '',
				value: ''
			}, {
				label: '正常',
				type: 'status',
				value: 1
			}, 
			{
				label: '注册时间正序',
				type: 'sort',
				value: 'newasc'
			},
			{
				label: '注册时间倒序',
				type: 'sort',
				value: 'newdesc'
			},

		]
		this.setData({
			sortItems,
			sortMenus
		})


	}

})