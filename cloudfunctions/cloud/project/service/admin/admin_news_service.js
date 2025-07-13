/**
 * Notes: 资讯后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux@qq.com
 * Date: 2021-07-11 07:48:00
 */

const BaseAdminService = require("./base_admin_service.js");

const dataUtil = require("../../../framework/utils/data_util.js");
const util = require("../../../framework/utils/util.js");
const timeUtil = require("../../../framework/utils/time_util.js");
const cloudUtil = require("../../../framework/cloud/cloud_util.js");

const NewsModel = require("../../model/news_model.js");

class AdminNewsService extends BaseAdminService {
  /**添加资讯 */
  async insertNews(
    adminId,
    {
      title,
      cateId, //分类
      cateName,
      order,
      type = 0, //类型
      desc = "",
      url = "", //外部链接
    }
  ) {
    try {
      // 1. 验证分类信息
      if (!cateId || !cateName) {
        this.AppError("分类不能为空");
      }

      // 2. 验证外部链接格式
      if (type === 1 && (!url || !url.startsWith("http"))) {
        this.AppError("外部链接格式不正确");
      }

      // 3. 构建资讯数据
      let data = {
        NEWS_ADMIN_ID: adminId, // 管理员ID
        NEWS_TITLE: title, // 标题
        NEWS_DESC: desc, // 描述
        NEWS_CATE_ID: cateId, // 分类ID
        NEWS_CATE_NAME: cateName, // 分类名称
        NEWS_ORDER: order, // 排序号
        NEWS_TYPE: type, // 类型（0=本地文章，1=外部链接）
        NEWS_URL: url, // 外部链接
        NEWS_STATUS: 0, // 状态（默认不启用）
        NEWS_HOME: 9999, // 首页推荐（默认不推荐）
        NEWS_CONTENT: [], // 内容数组
        NEWS_PIC: [], // 图片数组
        NEWS_VIEW_CNT: 0, // 访问次数
        NEWS_FAV_CNT: 0, // 收藏人数
        NEWS_COMMENT_CNT: 0, // 评论数
        NEWS_LIKE_CNT: 0, // 点赞数
      };

      // 4. 插入数据库
      let newsId = await NewsModel.insert(data);

      // 5. 返回结果
      return {
        id: newsId,
      };
    } catch (error) {
      this.AppError("添加资讯失败：" + error.message);
    }
    // this.AppError('此功能暂不开放，如有需要请加作者微信：cclinux0730');
  }

  /**删除资讯数据 */
  async delNews(id) {
    // 1. 先检查资讯是否存在
    let news = await NewsModel.getOne(id, "NEWS_TITLE,NEWS_PIC");
    if (!news) {
      this.AppError("资讯不存在");
    }

    // 2. 删除资讯记录
    await NewsModel.del(id);

    // 3. 如果有图片，可以删除云存储中的图片（可选）
    if (news.NEWS_PIC && news.NEWS_PIC.length > 0) {
      // 删除云存储图片的逻辑
      // await cloudUtil.deleteFileList(news.NEWS_PIC);
    }

    return true;
    // this.AppError('此功能暂不开放，如有需要请加作者微信：cclinux0730');
  }

  /**获取资讯信息 */
  async getNewsDetail(id) {
    let fields = "*";

    let where = {
      _id: id,
    };
    let news = await NewsModel.getOne(where, fields);
    if (!news) return null;

    return news;
  }

  /**
   * 更新富文本详细的内容及图片信息
   * @returns 返回 urls数组 [url1, url2, url3, ...]
   */
  async updateNewsContent({
    newsId,
    content, // 富文本数组
  }) {
    try {
      let where = {
        _id: newsId,
      };
      let data = {
        NEWS_CONTENT: content,
      };  
      await NewsModel.edit(where, data);

      return {
        result: "ok",
      };
    } catch (error) {
      this.AppError("更新文章内容失败：" + error.message);  
    }
    // this.AppError("此功能暂不开放，如有需要请加作者微信：cclinux0730");
  }

  /**
   * 更新资讯图片信息
   * @returns 返回 urls数组 [url1, url2, url3, ...]
   */
  async updateNewsPic({
    newsId,
    imgList, // 图片数组
  }) {
    try {
      let where = {
        _id: newsId,
      };
      let data = {
        NEWS_PIC: imgList,
      };  
      await NewsModel.edit(where, data);

      return {
        result: "ok",
      };
    } catch (error) {
      this.AppError("更新图片失败：" + error.message);
    }
  }

  /**更新资讯数据 */
  async editNews({
    id,
    title,
    cateId, //分类
    cateName,
    order,
    type = 0, //类型
    desc = "",
    url = "", //外部链接
  }) {
		try {
			// 1. 验证资讯是否存在
			let news = await NewsModel.getOne(id, "NEWS_TITLE");
			if (!news) {
				this.AppError("资讯不存在");
			}
	
			// 2. 验证分类信息
			if (!cateId || !cateName) {
				this.AppError("分类信息不能为空");
			}
	
			// 3. 验证外部链接格式
			if (type === 1 && (!url || !url.startsWith("http"))) {
				this.AppError("外部链接格式不正确");
			}
	
			// 4. 构建更新数据
			let data = {
				NEWS_TITLE: title, // 标题
				NEWS_DESC: desc, // 描述
				NEWS_CATE_ID: cateId, // 分类ID
				NEWS_CATE_NAME: cateName, // 分类名称
				NEWS_ORDER: order, // 排序号
				NEWS_TYPE: type, // 类型（0=本地文章，1=外部链接）
				NEWS_URL: url, // 外部链接
				NEWS_EDIT_TIME: timeUtil.time(), // 更新编辑时间
			};
	
			// 5. 更新数据库
			let where = {
				_id: id,
			};
			await NewsModel.edit(where, data);
	
			// 6. 返回结果
			return {
				result: "ok",
			};
		} catch (error) {
      this.AppError("更新文章失败：" + error.message);
    }

    // this.AppError("此功能暂不开放，如有需要请加作者微信：cclinux0730");
  }

  /**取得资讯分页列表 */
  async getNewsList({
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
      NEWS_ORDER: "asc",
      NEWS_ADD_TIME: "desc",
    };
    let fields =
      "NEWS_TYPE,NEWS_URL,NEWS_TITLE,NEWS_DESC,NEWS_CATE_ID,NEWS_EDIT_TIME,NEWS_ADD_TIME,NEWS_ORDER,NEWS_STATUS,NEWS_CATE_NAME,NEWS_HOME";

    let where = {};

    if (util.isDefined(search) && search) {
      where.or = [
        {
          NEWS_TITLE: ["like", search],
        },
      ];
    } else if (sortType && util.isDefined(sortVal)) {
      // 搜索菜单
      switch (sortType) {
        case "cateId":
          // 按类型
          where.NEWS_CATE_ID = sortVal;
          break;
        case "status":
          // 按类型
          where.NEWS_STATUS = Number(sortVal);
          break;
        case "home":
          // 按类型
          where.NEWS_HOME = Number(sortVal);
          break;
        case "sort":
          // 排序
          if (sortVal == "view") {
            orderBy = {
              NEWS_VIEW_CNT: "desc",
              NEWS_ADD_TIME: "desc",
            };
          }
          if (sortVal == "new") {
            orderBy = {
              NEWS_ADD_TIME: "desc",
            };
          }
          break;
      }
    }

    return await NewsModel.getList(
      where,
      fields,
      orderBy,
      page,
      size,
      isTotal,
      oldTotal
    );
  }

  /**修改资讯状态 */
  async statusNews(id, status) {
    try {
      let where = {
        _id: id,
      };
      let data = {
        NEWS_STATUS: status,
      };
      await NewsModel.edit(where, data);

      return {
        result: "ok",
      };
    } catch (error) {
      this.AppError("修改资讯状态失败：" + error.message);
    }

    // this.AppError("此功能暂不开放，如有需要请加作者微信：cclinux0730");
  }

  /**资讯置顶排序设定 */
  async sortNews(id, sort) {
    try {
      let where = {
        _id: id,
      };
      let data = {
        NEWS_ORDER: sort,
      };
      await NewsModel.edit(where, data);

      return {
        result: "ok",
      };
    } catch (error) {
      this.AppError("排序失败：" + error.message);
    }
    // this.AppError("此功能暂不开放，如有需要请加作者微信：cclinux0730");
  }
}

module.exports = AdminNewsService;
