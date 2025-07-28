/**
 * Notes: 内部人员后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY www.code3721.com
 * Date: 2024-01-01 00:00:00
 */

const BaseAdminService = require("./base_admin_service.js");
const timeUtil = require("../../../framework/utils/time_util.js");
const util = require("../../../framework/utils/util.js");
const cloudBase = require("../../../framework/cloud/cloud_base.js");
const config = require("../../../config/config.js");

const InternalUserModel = require("../../model/internal_user_model.js");

class AdminInternalUserService extends BaseAdminService {
  /** 取得内部人员分页列表 */
  async getInternalUserList({
    search, // 搜索条件
    sortType, // 搜索菜单
    sortVal, // 搜索菜单
    orderBy, // 排序
    whereEx, //附加查询条件
    page,
    size,
    oldTotal = 0,
  }) {
    orderBy = orderBy || {
      INTERNAL_USER_ADD_TIME: "desc",
    };
    let fields = "*";

    let where = {};
    where.and = {
      _pid: this.getProjectId(), //复杂的查询在此处标注PID
    };

    if (util.isDefined(search) && search) {
      where.or = [
        {
          INTERNAL_USER_NAME: ["like", search],
        },
        {
          INTERNAL_USER_MOBILE: ["like", search],
        },
        {
          INTERNAL_USER_WORK: ["like", search],
        },
      ];
    } else if (sortType && util.isDefined(sortVal)) {
      // 搜索菜单
      switch (sortType) {
        case "status":
          where.and.INTERNAL_USER_STATUS = Number(sortVal);
          break;
        case "city":
          where.and.INTERNAL_USER_CITY = sortVal;
          break;
        case "trade":
          where.and.INTERNAL_USER_TRADE = sortVal;
          break;
      }
    }

    let result = await InternalUserModel.getList(
      where,
      fields,
      orderBy,
      page,
      size,
      true,
      oldTotal,
      false
    );

    return result;
  }

  /** 导入内部人员数据 */
  	async importInternalUserData({
		fileID, // 云存储文件ID
	}, admin = null) {
		console.log("开始导入数据，fileID:", fileID);

		if (!fileID) {
			throw new Error("文件ID不能为空");
		}

		try {
			// 直接尝试插入数据，如果集合不存在会自动创建
      // 从云存储下载文件
      console.log("开始下载文件...");
      const cloud = cloudBase.getCloud();
      const res = await cloud.downloadFile({
        fileID: fileID,
      });
      const buffer = res.fileContent;
      console.log("文件下载成功，buffer长度:", buffer.length);

      // 解析Excel文件
      console.log("开始解析Excel...");
      let userList = await this.parseExcelFile(buffer);

      if (!userList || !Array.isArray(userList) || userList.length === 0) {
        throw new Error("Excel文件中没有有效的数据行，请检查数据格式是否正确");
      }

      // 批量验证和插入
      let successCount = 0;
      let failCount = 0;
      let failList = [];
      let validData = [];
      let mobileList = [];

      // 第一步：数据验证和收集
      for (let i = 0; i < userList.length; i++) {
        let userData = userList[i];
        
        // 数据验证
        if (!userData.mobile) {
          failCount++;
          failList.push({
            row: i + 1,
            reason: '手机号不能为空',
            data: userData
          });
          continue;
        }

        // 收集有效数据和手机号
        validData.push({
          index: i + 1,
          data: userData
        });
        mobileList.push(userData.mobile);
      }

      // 第二步：批量检查手机号是否已存在
      if (validData.length > 0) {
        let where = {
          and: {
            _pid: this.getProjectId(),
            INTERNAL_USER_MOBILE: ['in', mobileList],
          },
        };
        let existUsers = await InternalUserModel.getAll(where, 'INTERNAL_USER_MOBILE');
        let existMobileSet = new Set(existUsers.map(u => u.INTERNAL_USER_MOBILE));

        // 第三步：批量插入有效数据
        let insertData = [];
        for (let item of validData) {
          let userData = item.data;
          
          // 检查手机号是否已存在
          if (existMobileSet.has(userData.mobile)) {
            failCount++;
            failList.push({
              row: item.index,
              reason: '手机号已存在',
              data: userData,
            });
            continue;
          }

          // 准备插入数据
          let data = {
            INTERNAL_USER_NAME: userData.name,
            INTERNAL_USER_MOBILE: userData.mobile,
            INTERNAL_USER_CITY: "",
            INTERNAL_USER_TRADE: "",
            INTERNAL_USER_WORK: "",
            INTERNAL_USER_STATUS: InternalUserModel.STATUS.COMM,
            INTERNAL_USER_IMPORT_TIME: timeUtil.time(),
            INTERNAL_USER_IMPORT_ADMIN_ID: admin ? admin.ADMIN_ID : "",
            INTERNAL_USER_IMPORT_ADMIN_NAME: admin ? admin.ADMIN_NAME : "",
            INTERNAL_USER_ADD_TIME: timeUtil.time(),
            INTERNAL_USER_ADD_IP: "",
            INTERNAL_USER_EDIT_TIME: timeUtil.time(),
            INTERNAL_USER_EDIT_IP: "",
          };

          insertData.push(data);
        }

        // 批量插入
        if (insertData.length > 0) {
          console.log('准备批量插入数据，数量:', insertData.length);
          await InternalUserModel.insertBatch(insertData);
          console.log('批量数据插入成功');
          successCount = insertData.length;
        }
      }

      // 如果有失败记录，生成错误报告文件
      let errorReportUrl = null;
      if (failCount > 0 && failList.length > 0) {
        try {
          errorReportUrl = await this.generateErrorReport(failList);
        } catch (err) {
          console.log('生成错误报告失败:', err);
        }
      }

      return {
        successCount,
        failCount,
        failList,
        errorReportUrl,
      };
    } catch (err) {
      console.log("导入数据失败:", err);
      throw new Error("导入数据失败: " + err.message);
    }
  }

  /** 解析Excel文件 */
  async parseExcelFile(buffer) {
    try {
      const xlsx = require("node-xlsx");

      // 使用xlsx解析
      let sheets = xlsx.parse(buffer);

      if (!sheets || sheets.length === 0) {
        throw new Error("Excel文件格式错误");
      }

      // 获取第一个工作表的数据
      let sheetData = sheets[0].data;

      console.log("解析到的数据:", sheetData);

      if (!sheetData || sheetData.length < 2) {
        throw new Error("Excel文件内容为空或格式错误");
      }

      // 跳过表头，从第二行开始处理数据
      let userList = [];
      for (let i = 1; i < sheetData.length; i++) {
        let row = sheetData[i];
        if (!row || row.length === 0) continue; // 跳过空行

        // 提取数据（根据模板格式：姓名、手机号）
        let name = row[0] || "";
        let mobile = row[1] || "";

        // 跳过没有手机号的行
        if (!mobile || mobile.toString().trim() === "") continue;

        userList.push({
          name: name.toString().trim(),
          mobile: mobile.toString().trim(),
        });
      }

      console.log("解析出的用户数据:", userList);
      return userList;
    } catch (err) {
      console.log("解析Excel失败:", err);
      throw new Error("解析Excel文件失败: " + err.message);
    }
  }

  /** 删除内部人员 */
  async delInternalUser({ id }) {
    let where = {
      and: {
        _pid: this.getProjectId(),
        INTERNAL_USER_ID: id,
      },
    };

    await InternalUserModel.del(where);
  }

  /** 修改内部人员状态 */
  async statusInternalUser({ id, status }) {
    let where = {
      and: {
        _pid: this.getProjectId(),
        INTERNAL_USER_ID: id,
      },
    };

    let data = {
      INTERNAL_USER_STATUS: status,
    };

    await InternalUserModel.edit(where, data);
  }

  /** 生成导入模板Excel文件 */
  async generateImportTemplate() {
    // 生成Excel文件
    const xlsx = require("node-xlsx");

    // 准备Excel数据
    let excelData = [
      ["姓名(非必填)", "手机号(必填)"],
      ["张三", "13800138000"],
      ["李四", "13800138001"],
      ["王五", "13800138002"],
      ["", "13800138003"],
      ["", "13800138004"],
    ];

    // 生成Excel文件
    let buffer = await xlsx.build([
      {
        name: "用户导入模板",
        data: excelData,
        options: {
          "!cols": [
            { wch: 15 }, // 姓名列宽
            { wch: 15 }, // 手机号列宽
          ],
        },
      },
    ]);

    // 生成文件名
    let fileName =
      "internal_user_template_" + timeUtil.time("Y-M-D-H-I-S") + ".xlsx";
    let xlsPath = config.DATA_EXPORT_PATH + fileName;

    // 上传到云存储
    const cloud = cloudBase.getCloud();
    let upload = await cloud.uploadFile({
      cloudPath: xlsPath,
      fileContent: buffer,
    });

    if (!upload || !upload.fileID) {
      throw new Error("模板文件上传失败");
    }

    return {
      url: upload.fileID,
      fileName: fileName,
    };
  }

  /** 生成错误报告Excel文件 */
  async generateErrorReport(failList) {
    const xlsx = require("node-xlsx");
    const timeUtil = require("../../../framework/utils/time_util.js");
    const cloudBase = require("../../../framework/cloud/cloud_base.js");
    const config = require("../../../config/config.js");

    // 生成错误报告数据
    let reportData = [["行号", "姓名", "手机号", "错误原因"]];

    // 添加失败记录
    failList.forEach((item) => {
      reportData.push([
        item.row,
        item.data.name || "",
        item.data.mobile || "",
        item.reason,
      ]);
    });

    // 生成Excel文件
    let buffer = await xlsx.build([
      {
        name: "导入错误报告",
        data: reportData,
        options: {
          "!cols": [
            { wch: 8 }, // 行号列宽
            { wch: 15 }, // 姓名列宽
            { wch: 15 }, // 手机号列宽
            { wch: 30 }, // 错误原因列宽
          ],
        },
      },
    ]);

    // 生成文件名
    let fileName =
      "import_error_report_" + timeUtil.time("Y-M-D-H-I-S") + ".xlsx";
    let xlsPath = config.DATA_EXPORT_PATH + fileName;

    // 上传到云存储
    const cloud = cloudBase.getCloud();
    let upload = await cloud.uploadFile({
      cloudPath: xlsPath,
      fileContent: buffer,
    });

    if (!upload || !upload.fileID) {
      throw new Error("错误报告文件上传失败");
    }

    return upload.fileID;
  }
}

module.exports = AdminInternalUserService;
