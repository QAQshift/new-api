package operation_setting

import (
	cryptorand "crypto/rand"
	"errors"
	"fmt"
	"math"
	"math/big"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/config"
)

// 抽奖模式
const (
	// LotteryModeSegment 分段式：每累计消费固定额度获得一次抽奖机会，奖池固定。
	LotteryModeSegment = "segment"
	// LotteryModeTiered 阶梯式：第 n 次抽奖的消费门槛与奖品额度逐档递增，阶梯无限。
	LotteryModeTiered = "tiered"
)

const (
	// MaxLotteryPrizesPerPool 单个奖池最多档数，避免配置出无意义的长列表。
	MaxLotteryPrizesPerPool = 50
	// maxLotteryDrawIndex 计算阶梯时的档位上限，防止 (drawIndex-1)*step 溢出。
	maxLotteryDrawIndex = 1_000_000
)

// LotteryPrize 奖池中的一档奖品：按权重命中后，在 [Quota, QuotaMax] 区间内均匀
// 随机发放一份额度。QuotaMax 为 0（或小于等于 Quota）时表示固定额度，区间退化为
// 一个点 —— 升级前保存的奖池没有这个字段，解析后正好落到这条分支，行为不变。
//
// 两个字段的单位都与用户余额一致（系统内部额度单位），不绑定具体货币。
type LotteryPrize struct {
	Quota    int `json:"quota"`
	QuotaMax int `json:"quota_max,omitempty"`
	Weight   int `json:"weight"`
}

// PrizeMaxQuota 返回该档实际发放上限。上限缺失或不大于下限时退化为固定额度，
// 这样调用方不必在各处重复判断 0 值。
func (p LotteryPrize) PrizeMaxQuota() int {
	if p.QuotaMax <= p.Quota {
		return p.Quota
	}
	return p.QuotaMax
}

type LotterySetting struct {
	Enabled bool `json:"enabled"`
	// Mode 取 LotteryModeSegment 或 LotteryModeTiered。
	Mode string `json:"mode"`

	// ── 分段式 ──
	// SegmentConsumeQuota 每累计消费多少额度获得一次抽奖机会。
	SegmentConsumeQuota int            `json:"segment_consume_quota"`
	SegmentPrizes       []LotteryPrize `json:"segment_prizes"`

	// ── 阶梯式 ──
	// 第 n 次抽奖（n 从 1 开始）的累计消费门槛 = FirstThresholdQuota + (n-1) * ThresholdStepQuota
	FirstThresholdQuota int `json:"first_threshold_quota"`
	ThresholdStepQuota  int `json:"threshold_step_quota"`
	// 第 n 次抽奖使用的奖池 = TierPrizes 每档金额 + (n-1) * TierPrizeStep
	TierPrizes    []LotteryPrize `json:"tier_prizes"`
	TierPrizeStep int            `json:"tier_prize_step"`
	// TierPrizeMax > 0 时，阶梯式的单次奖品额度封顶（0 表示不封顶）。
	TierPrizeMax int `json:"tier_prize_max"`

	// 以下三个是抽奖在用户端的展示开关，只作用于抽奖。
	// 限时活动有自己独立的一套（welfare_setting.show_activity_*），
	// 两个模块各管各的，可以设成不一样。
	//
	// ShowPrizePool 关闭后抽奖不再出现奖池区域，只保留进度与抽奖按钮。
	ShowPrizePool bool `json:"show_prize_pool"`
	// ShowPrizeProbability 是否展示各档位的中奖概率（仅在展示奖池时有意义）。
	ShowPrizeProbability bool `json:"show_prize_probability"`
	// ShowLotteryHistory 是否展示抽奖记录。
	ShowLotteryHistory bool `json:"show_lottery_history"`
}

// 默认配置：默认关闭，避免升级后突然对所有站点开放抽奖。
var lotterySetting = LotterySetting{
	Enabled:             false,
	Mode:                LotteryModeSegment,
	SegmentConsumeQuota: 500_000, // 约 1 USD 的累计消费换一次抽奖
	SegmentPrizes: []LotteryPrize{
		{Quota: 10_000, Weight: 70},
		{Quota: 50_000, Weight: 25},
		{Quota: 200_000, Weight: 5},
	},
	FirstThresholdQuota: 500_000,
	ThresholdStepQuota:  500_000,
	TierPrizes: []LotteryPrize{
		{Quota: 10_000, Weight: 70},
		{Quota: 50_000, Weight: 25},
		{Quota: 200_000, Weight: 5},
	},
	TierPrizeStep: 10_000,
	TierPrizeMax:  5_000_000,

	// 三个展示开关默认开启，保持"加开关之前用户端总是展示"的行为
	ShowPrizePool:        true,
	ShowPrizeProbability: true,
	ShowLotteryHistory:   true,
}

func init() {
	config.GlobalConfig.Register("lottery_setting", &lotterySetting)
}

func GetLotterySetting() *LotterySetting {
	return &lotterySetting
}

// clampLotteryQuota 把额度收敛到钱包允许的整数范围内。
func clampLotteryQuota(value int64) int {
	if value < 0 {
		return 0
	}
	if value > int64(common.MaxWalletQuota) {
		return common.MaxWalletQuota
	}
	return int(value)
}

// normalizeDrawIndex 把档位收敛到合法范围，并防止后续乘法溢出。
func normalizeDrawIndex(drawIndex int) int {
	if drawIndex < 1 {
		return 1
	}
	if drawIndex > maxLotteryDrawIndex {
		return maxLotteryDrawIndex
	}
	return drawIndex
}

// saturatingMul 防止两个非负 int64 相乘溢出：溢出时饱和到 MaxInt64。
func saturatingMul(a, b int64) int64 {
	if a <= 0 || b <= 0 {
		return 0
	}
	if a > math.MaxInt64/b {
		return math.MaxInt64
	}
	return a * b
}

// saturatingAdd 防止两个非负 int64 相加溢出：溢出时饱和到 MaxInt64。
func saturatingAdd(a, b int64) int64 {
	if a < 0 {
		a = 0
	}
	if b <= 0 {
		return a
	}
	if b > math.MaxInt64-a {
		return math.MaxInt64
	}
	return a + b
}

// TierThresholdQuota 返回阶梯式第 drawIndex 次抽奖所需的累计消费额度。
// 档位与步长都由管理员配置，因此这里的乘法必须防溢出（AGENTS.md 计费安全不变量）。
func (s *LotterySetting) TierThresholdQuota(drawIndex int) int {
	if s == nil {
		return 0
	}
	index := int64(normalizeDrawIndex(drawIndex) - 1)
	step := saturatingMul(index, int64(s.ThresholdStepQuota))
	return clampLotteryQuota(saturatingAdd(int64(s.FirstThresholdQuota), step))
}

// TierPrizePoolFor 返回阶梯式第 drawIndex 次抽奖使用的奖池：
// 每档金额按 TierPrizeStep 递增，并按 TierPrizeMax 封顶，权重保持不变。
func (s *LotterySetting) TierPrizePoolFor(drawIndex int) []LotteryPrize {
	if s == nil || len(s.TierPrizes) == 0 {
		return nil
	}
	index := int64(normalizeDrawIndex(drawIndex) - 1)
	step := saturatingMul(index, int64(s.TierPrizeStep))
	pool := make([]LotteryPrize, len(s.TierPrizes))
	for i, prize := range s.TierPrizes {
		quota := saturatingAdd(int64(prize.Quota), step)
		// 只有真正的区间才一起抬高上限；固定额度的档位保持固定，
		// 否则会被 step 撑成一个它本来并不存在的区间。
		quotaMax := int64(0)
		if prize.QuotaMax > prize.Quota {
			quotaMax = saturatingAdd(int64(prize.QuotaMax), step)
		}
		if s.TierPrizeMax > 0 {
			if quota > int64(s.TierPrizeMax) {
				quota = int64(s.TierPrizeMax)
			}
			if quotaMax > int64(s.TierPrizeMax) {
				quotaMax = int64(s.TierPrizeMax)
			}
		}
		pool[i] = LotteryPrize{
			Quota:    clampLotteryQuota(quota),
			QuotaMax: clampLotteryQuota(quotaMax),
			Weight:   prize.Weight,
		}
	}
	return pool
}

// PrizePoolFor 返回第 drawIndex 次抽奖（1-based）应使用的奖池。
func (s *LotterySetting) PrizePoolFor(drawIndex int) []LotteryPrize {
	if s == nil {
		return nil
	}
	if s.Mode == LotteryModeTiered {
		return s.TierPrizePoolFor(drawIndex)
	}
	return s.SegmentPrizes
}

// ThresholdQuotaFor 返回第 drawIndex 次抽奖（1-based）所需的累计消费额度。
func (s *LotterySetting) ThresholdQuotaFor(drawIndex int) int {
	if s == nil {
		return 0
	}
	if s.Mode == LotteryModeTiered {
		return s.TierThresholdQuota(drawIndex)
	}
	if s.SegmentConsumeQuota <= 0 {
		return 0
	}
	index := int64(normalizeDrawIndex(drawIndex))
	return clampLotteryQuota(saturatingMul(index, int64(s.SegmentConsumeQuota)))
}

// EarnedDrawsFor 返回在分段式下，累计消费 usedQuota 一共可以兑换多少次抽奖机会。
func (s *LotterySetting) EarnedDrawsFor(usedQuota int) int {
	if s == nil || s.SegmentConsumeQuota <= 0 || usedQuota <= 0 {
		return 0
	}
	earned := int64(usedQuota) / int64(s.SegmentConsumeQuota)
	if earned > int64(maxLotteryDrawIndex) {
		return maxLotteryDrawIndex
	}
	return int(earned)
}

// PickLotteryPrize 按权重从奖池中随机抽取一档奖品，返回奖品额度。
// 使用 crypto/rand，避免可预测的随机序列影响真实奖品发放。
func PickLotteryPrize(pool []LotteryPrize) (int, error) {
	if len(pool) == 0 {
		return 0, errors.New("奖池为空，无法抽奖")
	}
	total := int64(0)
	for _, prize := range pool {
		if prize.Weight <= 0 {
			return 0, errors.New("奖池权重必须大于 0")
		}
		if prize.Quota <= 0 {
			return 0, errors.New("奖池奖品额度必须大于 0")
		}
		total += int64(prize.Weight)
		if total <= 0 {
			return 0, errors.New("奖池权重之和超出范围")
		}
	}
	if total <= 0 {
		return 0, errors.New("奖池权重之和必须大于 0")
	}

	hit, err := cryptorand.Int(cryptorand.Reader, big.NewInt(total))
	if err != nil {
		return 0, err
	}
	remaining := hit.Int64()
	for _, prize := range pool {
		remaining -= int64(prize.Weight)
		if remaining < 0 {
			return randomPrizeQuota(prize)
		}
	}
	// 理论上不可达：上面的权重之和保证必然命中。
	return randomPrizeQuota(pool[len(pool)-1])
}

// randomPrizeQuota 在一档奖品允许的区间 [Quota, PrizeMaxQuota()] 内均匀取值。
// 区间退化成一个点时直接返回该值，不消耗随机数。
func randomPrizeQuota(prize LotteryPrize) (int, error) {
	low := int64(prize.Quota)
	high := int64(prize.PrizeMaxQuota())
	if high <= low {
		return clampLotteryQuota(low), nil
	}
	span := high - low + 1
	offset, err := cryptorand.Int(cryptorand.Reader, big.NewInt(span))
	if err != nil {
		return 0, err
	}
	return clampLotteryQuota(low + offset.Int64()), nil
}

// ValidatePrizeTier 校验单档奖品的额度区间与权重。
// 抽奖奖池与限时活动奖池共用同一套约束，避免两边规则漂移。
func ValidatePrizeTier(prize LotteryPrize) error {
	if prize.Quota <= 0 {
		return errors.New("奖品额度必须大于 0")
	}
	if prize.QuotaMax < 0 {
		return errors.New("奖品上限不能为负数")
	}
	if prize.QuotaMax > 0 && prize.QuotaMax < prize.Quota {
		return errors.New("奖品上限不能低于额度下限")
	}
	if prize.PrizeMaxQuota() > common.MaxWalletQuota {
		return errors.New("奖品额度超过单次发放上限")
	}
	if prize.Weight <= 0 {
		return errors.New("权重必须大于 0")
	}
	return nil
}

func validateLotteryPrizePool(name string, pool []LotteryPrize, ceiling int) error {
	if len(pool) == 0 {
		return fmt.Errorf("%s至少需要配置一档奖品", name)
	}
	if len(pool) > MaxLotteryPrizesPerPool {
		return fmt.Errorf("%s最多支持 %d 档奖品", name, MaxLotteryPrizesPerPool)
	}
	totalWeight := int64(0)
	for i, prize := range pool {
		if err := ValidatePrizeTier(prize); err != nil {
			return fmt.Errorf("%s第 %d 档：%w", name, i+1, err)
		}
		if ceiling > 0 && prize.PrizeMaxQuota() > ceiling {
			return fmt.Errorf("%s第 %d 档的奖品额度超过封顶值", name, i+1)
		}
		totalWeight += int64(prize.Weight)
		if totalWeight <= 0 {
			return fmt.Errorf("%s的权重之和超出范围", name)
		}
	}
	return nil
}

// ValidateLotterySetting 校验当前抽奖配置，返回可直接展示给管理员的错误。
func ValidateLotterySetting(s *LotterySetting) error {
	if s == nil {
		return errors.New("抽奖配置不能为空")
	}
	switch s.Mode {
	case LotteryModeSegment:
		if s.SegmentConsumeQuota <= 0 {
			return errors.New("分段式的每档消费额度必须大于 0")
		}
		return validateLotteryPrizePool("分段式奖池", s.SegmentPrizes, 0)
	case LotteryModeTiered:
		if s.FirstThresholdQuota <= 0 {
			return errors.New("阶梯式的首档门槛必须大于 0")
		}
		if s.ThresholdStepQuota <= 0 {
			return errors.New("阶梯式的每档递增步长必须大于 0")
		}
		if s.TierPrizeStep < 0 {
			return errors.New("阶梯式的奖品递增步长不能为负数")
		}
		if s.TierPrizeMax < 0 {
			return errors.New("阶梯式的奖品封顶不能为负数")
		}
		return validateLotteryPrizePool("阶梯式奖池", s.TierPrizes, s.TierPrizeMax)
	default:
		return fmt.Errorf("不支持的抽奖模式：%s", s.Mode)
	}
}
