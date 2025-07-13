/**
 * Notes: 预约后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY www.code3721.com
 * Date: 2021-12-08 07:48:00
 */

const BaseAdminService = require("./base_admin_service.js");
const MeetService = require("../meet_service.js");
const dataUtil = require("../../../framework/utils/data_util.js");
const timeUtil = require("../../../framework/utils/time_util.js");
const util = require("../../../framework/utils/util.js");
const cloudUtil = require("../../../framework/cloud/cloud_util.js");
const cloudBase = require("../../../framework/cloud/cloud_base.js");

const MeetModel = require("../../model/meet_model.js");
const JoinModel = require("../../model/join_model.js");
const DayModel = require("../../model/day_model.js");
const config = require("../../../config/config.js");

class AdminMeetService extends BaseAdminService {
  /** 预约数据列表 */
  async getDayList(meetId, start, end) {
    let where = {
      DAY_MEET_ID: meetId,
      day: ["between", start, end],
    };
    let orderBy = {
      day: "asc",
    };
    return await DayModel.getAllBig(where, "day,times,dayDesc", orderBy);
  }

  // 按项目统计人数
  async statJoinCntByMeet(meetId) {
    let today = timeUtil.time("Y-M-D");
    let where = {
      day: [">=", today],
      DAY_MEET_ID: meetId,
    };

    let meetService = new MeetService();
    let list = await DayModel.getAllBig(where, "DAY_MEET_ID,times", {}, 1000);
    for (let k in list) {
      let meetId = list[k].DAY_MEET_ID;
      let times = list[k].times;

      for (let j in times) {
        let timeMark = times[j].mark;
        meetService.statJoinCnt(meetId, timeMark);
      }
    }
  }

  /** 自助签到码 */
  async genSelfCheckinQr(page, timeMark) {
    this.AppError("此功能暂不开放，如有需要请加作者微信：cclinux0730");
  }

  /** 管理员按钮核销 */
  async checkinJoin(joinId, flag) {
    try {
      // 先获取预约记录信息
      let where = {
        _id: joinId,
      };
      let join = await JoinModel.getOne(where, 'JOIN_ID,JOIN_IS_CHECKIN,JOIN_STATUS,JOIN_USER_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END');
      
      if (!join) {
        this.AppError("预约记录不存在");
        return {
          result: "error",
          msg: "预约记录不存在",
        }
      }
      
      // 检查预约状态是否为成功状态
      if (join.JOIN_STATUS != JoinModel.STATUS.SUCC) {
        this.AppError("只能对预约成功的记录进行签到操作");
        return {
          result: "error",
          msg: "只能对预约成功的记录进行签到操作",
        }
      }
      
      // 检查是否重复操作
      if (flag == 1 && join.JOIN_IS_CHECKIN == 1) {
        this.AppError("该预约已经签到，请勿重复操作");
        return {
          result: "error",
          msg: "该预约已经签到，请勿重复操作",
        }
      }
      
      if (flag == 0 && join.JOIN_IS_CHECKIN == 0) {
        this.AppError("该预约尚未签到，无法取消签到");
        return {
          result: "error",
          msg: "该预约尚未签到，无法取消签到",
        }
      }
      
      // 更新签到状态
      let data = {
        JOIN_IS_CHECKIN: flag,
        JOIN_EDIT_TIME: timeUtil.time(),
      };
      await JoinModel.edit(where, data);
      
      let actionText = flag == 1 ? "签到" : "取消签到";
      return {
        result: "ok",
        msg: actionText + "成功",
        data: {
          userName: join.JOIN_USER_ID,
          meetTitle: join.JOIN_MEET_TITLE,
          meetDay: join.JOIN_MEET_DAY,
          meetTime: join.JOIN_MEET_TIME_START + " - " + join.JOIN_MEET_TIME_END,
          isCheckin: flag,
        }
      }
    } catch (error) {
      this.AppError("签到核销失败：" + error.message);
      return {
        result: "error",
        msg: error.message,
      }
    }
  }

  /** 管理员扫码核销 */
  async scanJoin(meetId, code) {
    try {
      // 通过核验码查找对应的预约记录
      let where = {
        JOIN_CODE: code,
        JOIN_MEET_ID: meetId,
        JOIN_STATUS: JoinModel.STATUS.SUCC, // 只处理预约成功的记录
      };

      let join = await JoinModel.getOne(
        where,
        "_id,JOIN_IS_CHECKIN,JOIN_USER_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END"
      );

      if (!join) {
        this.AppError("核验码无效或预约记录不存在");
        return {
          result: "error",
          msg: "核验码无效或预约记录不存在",
        };
      }

      if (join.JOIN_IS_CHECKIN == 1) {
        this.AppError("该预约已经签到，请勿重复核销");
        return {
          result: "error",
          msg: "该预约已经签到，请勿重复核销",
        };
      }

      // 更新签到状态
      let updateWhere = {
        _id: join._id,
      };
      let data = {
        JOIN_IS_CHECKIN: 1, // 设置为已签到
        JOIN_EDIT_TIME: timeUtil.time(),
      };
      await JoinModel.edit(updateWhere, data);
			console.log(updateWhere, data, 'scanJoin', join);

      return {
        result: "ok",
        msg: "核销成功",
        data: {
          userName: join.JOIN_USER_ID,
          meetTitle: join.JOIN_MEET_TITLE,
          meetDay: join.JOIN_MEET_DAY,
          meetTime: join.JOIN_MEET_TIME_START + " - " + join.JOIN_MEET_TIME_END,
        },
      };
    } catch (error) {
      this.AppError("扫码核销失败：" + error.message);
      return {
        result: "error",
        msg: error.message,
      };
    }
  }

  /**
   * 判断本日是否有预约记录
   * @param {*} daySet daysSet的节点
   */
  checkHasJoinCnt(times) {
    if (!times) return false;
    for (let k in times) {
      if (times[k].stat.succCnt) return true;
    }
    return false;
  }

  // 判断含有预约的日期
  getCanModifyDaysSet(daysSet) {
    let now = timeUtil.time("Y-M-D");

    for (let k in daysSet) {
      if (daysSet[k].day < now) continue;
      daysSet[k].hasJoin = this.checkHasJoinCnt(daysSet[k].times);
    }

    return daysSet;
  }

  /** 取消某个时间段的所有预约记录 */
  async cancelJoinByTimeMark(admin, meetId, timeMark, reason) {
    this.AppError("此功能暂不开放，如有需要请加作者微信：cclinux0730");
  }

  /**添加 */
  async insertMeet(
    adminId,
    { title, order, typeId, typeName, daysSet, isShowLimit, formSet }
  ) {
    try {
      // 处理日期设置，提取可用日期
      let days = [];
      if (daysSet && Array.isArray(daysSet)) {
        for (let k in daysSet) {
          if (daysSet[k].day) {
            days.push(daysSet[k].day);
          }
        }
      }

      let meetId = await MeetModel.insert({
        MEET_ADMIN_ID: adminId,
        MEET_TITLE: title,
        MEET_ORDER: order,
        MEET_TYPE_ID: typeId,
        MEET_TYPE_NAME: typeName,
        MEET_DAYS: days, // 保存可用日期数组
        MEET_IS_SHOW_LIMIT: isShowLimit,
        MEET_FORM_SET: formSet,
        MEET_STATUS: MeetModel.STATUS.COMM, // 默认使用中状态
      });

      // 处理日期设置到day表
      if (daysSet && Array.isArray(daysSet)) {
        await this._editDays(meetId, timeUtil.time("Y-M-D"), daysSet);
      }

      return {
        id: meetId,
      };
    } catch (error) {
      this.AppError("插入活动失败：" + error.message);
    }
  }

  /**删除数据 */
  async delMeet(id) {
    try {
      await MeetModel.del(id);
      return {
        result: "ok",
      };
    } catch (error) {
      this.AppError("删除活动失败：" + error.message);
      return {
        result: "error",
        msg: error.message,
      };
    }
  }

  /**获取信息 */
  async getMeetDetail(id) {
    let fields = "*";

    let where = {
      _id: id,
    };
    let meet = await MeetModel.getOne(where, fields);
    if (!meet) return null;

    let meetService = new MeetService();
    meet.MEET_DAYS_SET = await meetService.getDaysSet(
      id,
      timeUtil.time("Y-M-D")
    ); //今天及以后

    return meet;
  }

  /**
   * 更新富文本详细的内容及图片信息
   * @returns 返回 urls数组 [url1, url2, url3, ...]
   */
  async updateMeetContent({
    meetId,
    content, // 富文本数组
  }) {
    try {
      let where = {
        _id: meetId,
      };
      let data = {
        MEET_CONTENT: content,
      };
      await MeetModel.edit(where, data);
    } catch (error) {
      this.AppError("更新活动内容失败：" + error.message);
    }
  }

  /**
   * 更新封面内容及图片信息
   * @returns 返回 urls数组 [url1, url2, url3, ...]
   */
  async updateMeetStyleSet({ meetId, styleSet }) {
    try {
      let where = {
        _id: meetId,
      };
      let data = {
        MEET_STYLE_SET: styleSet,
      };
      await MeetModel.edit(where, data);
    } catch (error) {
      this.AppError("更新活动封面图失败：" + error.message);
    }
  }

  /** 更新日期设置 */
  async _editDays(meetId, nowDay, daysSetData) {
    try {
      // 先删除该活动的所有日期设置
      await DayModel.del({
        DAY_MEET_ID: meetId,
      });

      // 插入新的日期设置
      if (daysSetData && Array.isArray(daysSetData)) {
        for (let k in daysSetData) {
          let dayData = daysSetData[k];
          if (dayData.day && dayData.times && Array.isArray(dayData.times)) {
            // 为每个时间段添加统计信息
            for (let j in dayData.times) {
              dayData.times[j].stat = {
                succCnt: 0, // 预约成功
                cancelCnt: 0, // 已取消
                adminCancelCnt: 0, // 后台取消
              };
            }

            await DayModel.insert({
              DAY_MEET_ID: meetId,
              day: dayData.day,
              dayDesc: dayData.dayDesc || "",
              times: dayData.times,
            });
          }
        }
      }
    } catch (error) {
      this.AppError("更新日期设置失败：" + error.message);
    }
  }

  /**更新数据 */
  async editMeet({
    id,
    title,
    typeId,
    typeName,
    order,
    daysSet,
    isShowLimit,
    formSet,
  }) {
    try {
      // 处理日期设置，提取可用日期
      let days = [];
      if (daysSet && Array.isArray(daysSet)) {
        for (let k in daysSet) {
          if (daysSet[k].day) {
            days.push(daysSet[k].day);
          }
        }
      }

      // 更新活动基本信息
      let where = {
        _id: id,
      };
      let data = {
        MEET_TITLE: title,
        MEET_ORDER: order,
        MEET_TYPE_ID: typeId,
        MEET_TYPE_NAME: typeName,
        MEET_DAYS: days, // 保存可用日期数组
        MEET_IS_SHOW_LIMIT: isShowLimit,
        MEET_FORM_SET: formSet,
      };
      await MeetModel.edit(where, data);

      // 处理日期设置到day表
      if (daysSet && Array.isArray(daysSet)) {
        await this._editDays(id, timeUtil.time("Y-M-D"), daysSet);
      }

      return {
        result: "ok",
      };
    } catch (error) {
      this.AppError("修改活动失败：" + error.message);
      return {
        result: "error",
        msg: error.message,
      };
    }
  }

  /**预约名单分页列表 */
  async getJoinList({
    search, // 搜索条件
    sortType, // 搜索菜单
    sortVal, // 搜索菜单
    orderBy, // 排序
    meetId,
    mark,
    page,
    size,
    isTotal = true,
    oldTotal,
  }) {
    orderBy = orderBy || {
      JOIN_EDIT_TIME: "desc",
    };
    let fields =
      "JOIN_IS_CHECKIN,JOIN_CODE,JOIN_ID,JOIN_REASON,JOIN_USER_ID,JOIN_MEET_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END,JOIN_MEET_TIME_MARK,JOIN_FORMS,JOIN_STATUS,JOIN_EDIT_TIME";

    let where = {
      JOIN_MEET_ID: meetId,
      JOIN_MEET_TIME_MARK: mark,
    };
    if (util.isDefined(search) && search) {
      where["JOIN_FORMS.val"] = {
        $regex: ".*" + search,
        $options: "i",
      };
    } else if (sortType && util.isDefined(sortVal)) {
      // 搜索菜单
      switch (sortType) {
        case "status":
          // 按类型
          sortVal = Number(sortVal);
          if (sortVal == 1099)
            //取消的2种
            where.JOIN_STATUS = ["in", [10, 99]];
          else where.JOIN_STATUS = Number(sortVal);
          break;
        case "checkin":
          // 签到
          where.JOIN_STATUS = JoinModel.STATUS.SUCC;
          if (sortVal == 1) {
            where.JOIN_IS_CHECKIN = 1;
          } else {
            where.JOIN_IS_CHECKIN = 0;
          }
          break;
      }
    }

    return await JoinModel.getList(
      where,
      fields,
      orderBy,
      page,
      size,
      isTotal,
      oldTotal
    );
  }

  /**预约项目分页列表 */
  async getMeetList({
    search, // 搜索条件
    sortType, // 搜索菜单
    sortVal, // 搜索菜单
    orderBy, // 排序
    whereEx, //附加查询条件
    page,
    size,
    isTotal = true,
    oldTotal,
  }) {
    orderBy = orderBy || {
      MEET_ORDER: "asc",
      MEET_ADD_TIME: "desc",
    };
    let fields =
      "MEET_TYPE,MEET_TYPE_NAME,MEET_TITLE,MEET_STATUS,MEET_DAYS,MEET_ADD_TIME,MEET_EDIT_TIME,MEET_ORDER";

    let where = {};
    if (util.isDefined(search) && search) {
      where.MEET_TITLE = {
        $regex: ".*" + search,
        $options: "i",
      };
    } else if (sortType && util.isDefined(sortVal)) {
      // 搜索菜单
      switch (sortType) {
        case "status":
          // 按类型
          where.MEET_STATUS = Number(sortVal);
          break;
        case "typeId":
          // 按类型
          where.MEET_TYPE_ID = sortVal;
          break;
        case "sort":
          // 排序
          if (sortVal == "view") {
            orderBy = {
              MEET_VIEW_CNT: "desc",
              MEET_ADD_TIME: "desc",
            };
          }

          break;
      }
    }

    return await MeetModel.getList(
      where,
      fields,
      orderBy,
      page,
      size,
      isTotal,
      oldTotal
    );
  }

  /** 删除 */
  async delJoin(joinId) {
    this.AppError("此功能暂不开放，如有需要请加作者微信：cclinux0730");
  }

  /**修改报名状态
   * 特殊约定 99=>正常取消
   */
  async statusJoin(admin, joinId, status, reason = "") {
    this.AppError("此功能暂不开放，如有需要请加作者微信：cclinux0730");
  }

  /**修改项目状态 */
  async statusMeet(id, status) {
    try {
      let where = {
        _id: id,
      };
      let data = {
        MEET_STATUS: status,
      };
      await MeetModel.edit(where, data);
    } catch (error) {
      this.AppError("修改活动状态失败：" + error.message);
      return {
        result: "error",
        msg: error.message,
      };
    }
  }

  /**置顶排序设定 */
  async sortMeet(id, sort) {
    try {
      let where = {
        _id: id,
      };
      let data = {
        MEET_ORDER: sort,
      };
      await MeetModel.edit(where, data);
      return {
        result: "ok",
      };
    } catch (error) {
      this.AppError("排序失败：" + error.message);
      return {
        result: "error",
        msg: error.message,
      };
    }
  }
}

module.exports = AdminMeetService;
