// 昆虫冷知识数据
export const insectColdKnowledge = [
  {
    id: "001",
    category: "生命周期",
    content: "蝴蝶从卵到成虫需要经过4个阶段：卵、幼虫（毛毛虫）、蛹和成虫。这个过程称为完全变态发育。",
    related_insects: ["蝴蝶", "蛾"],
    season: ["春季", "夏季", "秋季"],
    seasonal_tips: [
      {
        month: "4-5月",
        description: "春季是蝴蝶开始活跃的季节",
        tips: "在花丛中更容易观察到蝴蝶",
        active_insects: ["菜粉蝶", "柑橘凤蝶"]
      }
    ]
  },
  {
    id: "002",
    category: "行为习性",
    content: "蚂蚁是社会性昆虫，一个蚁巢中可以有几万甚至几十万只蚂蚁，它们分工明确，有蚁后、雄蚁、工蚁和兵蚁。",
    related_insects: ["蚂蚁", "白蚁"],
    season: ["全年"],
    seasonal_tips: [
      {
        month: "6-8月",
        description: "夏季蚂蚁活动最频繁",
        tips: "保持环境清洁，避免食物残渣吸引蚂蚁",
        active_insects: ["红火蚁", "黑蚁"]
      }
    ]
  },
  {
    id: "003",
    category: "形态特征",
    content: "蜻蜓的复眼由28000多个小眼组成，这让它们拥有几乎360度的视野，可以同时看到上下前后左右的物体。",
    related_insects: ["蜻蜓", "豆娘"],
    season: ["夏季", "秋季"],
    seasonal_tips: [
      {
        month: "7-9月",
        description: "夏季是蜻蜓繁殖的高峰期",
        tips: "在水域附近可以观察到蜻蜓点水的现象",
        active_insects: ["碧伟蜓", "黄蜻"]
      }
    ]
  },
  {
    id: "004",
    category: "生态作用",
    content: "蜜蜂不仅能制造蜂蜜，它们还是重要的花粉传播者，地球上约70%的农作物依赖蜜蜂等昆虫授粉。",
    related_insects: ["蜜蜂", "熊蜂"],
    season: ["春季", "夏季"],
    seasonal_tips: [
      {
        month: "3-6月",
        description: "春季是蜜蜂采蜜的旺季",
        tips: "不要在花丛中喷洒农药，保护蜜蜂等授粉昆虫",
        active_insects: ["中华蜜蜂", "意大利蜂"]
      }
    ]
  },
  {
    id: "005",
    category: "防御机制",
    content: "螳螂遇到危险时会展开前翅，露出鲜艳的颜色，并抬起前足做出攻击姿势，这种行为称为\"威胁展示\"。",
    related_insects: ["螳螂", "竹节虫"],
    season: ["夏季", "秋季"],
    seasonal_tips: [
      {
        month: "8-10月",
        description: "秋季是螳螂的交配季节",
        tips: "在草丛和灌木中更容易发现螳螂",
        active_insects: ["广斧螳", "大刀螳"]
      }
    ]
  },
  {
    id: "006",
    category: "身体构造",
    content: "蜻蜓的复眼由多达2.8万个小眼组成，视野几乎达到360度。",
    related_insects: ["蜻蜓"],
    season: ["夏季"],
    seasonal_tips: [
      {
        month: "6-8月",
        description: "夏季蜻蜓数量最多",
        tips: "清晨和黄昏时分在湖边观察蜻蜓效果最佳",
        active_insects: ["红蜻蜓", "绿蜻蜓"]
      }
    ]
  },
  {
    id: "007",
    category: "身体构造",
    content: "蚂蚁的触角既是嗅觉器官，也是'语言'交流工具，通过触碰传递信息。",
    related_insects: ["蚂蚁"],
    season: ["全年"],
    seasonal_tips: [
      {
        month: "全年",
        description: "蚂蚁全年可见",
        tips: "观察蚂蚁搬运食物的行为很有趣",
        active_insects: ["黑蚂蚁", "红蚂蚁"]
      }
    ]
  },
  {
    id: "008",
    category: "身体构造",
    content: "苍蝇尝味道靠的是脚，它们的脚上有大量味觉感受器。",
    related_insects: ["苍蝇"],
    season: ["夏季"],
    seasonal_tips: [
      {
        month: "5-9月",
        description: "夏季苍蝇繁殖活跃",
        tips: "保持食物密封可以减少苍蝇侵扰",
        active_insects: ["家蝇", "果蝇"]
      }
    ]
  }
];

// 衣物颜色建议
export const clothingTips = {
  avoid_colors: [
    { insects: ["蚊子", "苍蝇"], colors: ["深色", "黑色"], reason: "这些昆虫对深色物体更敏感" },
    { insects: ["蜂类"], colors: ["黄色", "亮色"], reason: "这些颜色类似于花朵，容易吸引蜂类" }
  ],
  recommended_colors: ["浅蓝", "白色", "米色"],
  general_advice: "在户外活动时，选择浅色衣物可以减少昆虫叮咬的风险"
};

// 观察提示
export const observationTips = [
  "观察昆虫时保持安静，避免突然动作惊吓它们",
  "不要直接用手抓取未知的昆虫，有些可能有毒或会叮咬",
  "使用放大镜可以更清楚地观察昆虫的细节",
  "记录观察到的昆虫种类和行为，积累自然观察经验",
  "尊重自然环境，不要破坏昆虫的栖息地"
];