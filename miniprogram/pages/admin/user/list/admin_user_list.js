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
			extension: ['csv'],
			success: async (res) => {
				let file = res.tempFiles[0];
				if (!file) {
					pageHelper.showModal('请选择CSV文件');
					return;
				}

				// 检查文件大小（限制为5MB）
				if (file.size > 5 * 1024 * 1024) {
					pageHelper.showModal('文件大小不能超过5MB，请选择较小的文件');
					return;
				}

				try {
					// 读取文件内容
					let fileContent = await this.readFileAsArrayBuffer(file.path);
					
					// 前端解析Excel文件
					let userList = this.parseExcelFile(fileContent);
					
					if (userList.length === 0) {
						pageHelper.showModal('CSV文件中没有有效的数据行，请检查数据格式是否正确');
						return;
					}

					// 发送解析后的数据到服务端插入
					let options = {
						title: '数据导入中'
					}

					let importResult = await cloudHelper.callCloudData('admin/internal_user_import', {
						userList: userList
					}, options);

					if (importResult) {
						let message = '导入完成！\n\n';
						message += '成功导入：' + importResult.successCount + '条\n';
						message += '失败：' + importResult.failCount + '条\n';
						
						if (importResult.failCount > 0 && importResult.failList && importResult.failList.length > 0) {
							message += '\n失败详情：\n';
							importResult.failList.slice(0, 5).forEach(item => {
								message += '第' + item.row + '行：' + item.reason + '\n';
							});
							if (importResult.failList.length > 5) {
								message += '... 还有' + (importResult.failList.length - 5) + '条失败记录';
							}
							
							// 如果有错误报告文件，提供下载
							if (importResult.errorReportUrl) {
								message += '\n\n已生成错误报告文件，是否下载？';
								
								wx.showModal({
									title: '导入完成',
									content: message,
									confirmText: '下载错误报告',
									cancelText: '关闭',
									success: (res) => {
										if (res.confirm) {
											this.downloadErrorReport(importResult.errorReportUrl);
										}
									}
								});
							} else {
								pageHelper.showModal(message);
							}
						} else {
							pageHelper.showModal(message);
						}
					} else {
						pageHelper.showModal('导入失败，请重试');
					}

				} catch (err) {
					console.log('导入失败', err);
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

	/** 读取文件为ArrayBuffer */
	readFileAsArrayBuffer: function (filePath) {
		return new Promise((resolve, reject) => {
			wx.getFileSystemManager().readFile({
				filePath: filePath,
				success: (res) => {
					resolve(res.data);
				},
				fail: (err) => {
					reject(err);
				}
			});
		});
	},

	/** 前端解析Excel文件 */
	parseExcelFile: function (fileContent) {
		try {
			// 将ArrayBuffer转换为字符串
			let uint8Array = new Uint8Array(fileContent);
			let text = '';
			for (let i = 0; i < uint8Array.length; i++) {
				text += String.fromCharCode(uint8Array[i]);
			}
			
			console.log('文件内容:', text.substring(0, 200) + '...');
			
			// 简单的CSV解析（适用于Excel导出的CSV格式）
			let lines = text.split('\n');
			let csvData = [];
			
			for (let j = 0; j < lines.length; j++) {
				let line = lines[j].trim();
				if (line) {
					// 处理CSV中的引号和逗号
					let cells = this.parseCSVLine(line);
					csvData.push(cells);
				}
			}
			
			console.log('解析到的数据:', csvData);
			
			if (!csvData || csvData.length < 2) {
				throw new Error('Excel文件内容为空或格式错误');
			}
			
			// 跳过表头，从第二行开始处理数据
			let userList = [];
			for (let i = 1; i < csvData.length; i++) {
				let row = csvData[i];
				if (!row || row.length === 0) continue; // 跳过空行
				
				// 提取数据（根据模板格式：姓名、手机号、城市、行业、单位）
				let name = row[0] || '';
				let mobile = row[1] || '';
				let city = row[2] || '';
				let trade = row[3] || '';
				let work = row[4] || '';
				
				// 跳过没有手机号的行
				if (!mobile || mobile.toString().trim() === '') continue;
				
				userList.push({
					name: name.toString().trim(),
					mobile: mobile.toString().trim(),
					city: city.toString().trim(),
					trade: trade.toString().trim(),
					work: work.toString().trim()
				});
			}
			
			console.log('解析出的用户数据:', userList);
			return userList;
			
		} catch (err) {
			console.log('解析CSV失败:', err);
			throw new Error('解析CSV文件失败: ' + err.message);
		}
	},

	/** 解析CSV行 */
	parseCSVLine: function (line) {
		let cells = [];
		let current = '';
		let inQuotes = false;
		
		for (let i = 0; i < line.length; i++) {
			let char = line[i];
			
			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				cells.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		
		cells.push(current.trim());
		return cells;
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