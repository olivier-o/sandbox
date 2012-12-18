class Box < ActiveRecord::Base
  after_initialize :init
  before_save :set_delivery_status
  after_save :complete

  belongs_to :user
  has_many :boxes_pals
  has_many :pals , :through => :boxes_pals
  has_many :messages, :through => :packs
  has_many :dispatchers , :through => :boxes_pals, :source => :pal
  has_many :readers, :through => :packs, :source  => :pals , :uniq => true

  has_many :packs, :dependent => :delete_all, :uniq => true

  has_many :box_activations, :dependent => :delete_all

  has_one :checklist

  accepts_nested_attributes_for :messages
  accepts_nested_attributes_for :packs, :allow_destroy => true

  attr_accessible :name,  :secure_retrieval,:notify_span, :trigger_at,:lifetime, :user_id, :pals_attributes , :dispatcher_emails , :pal_ids ,:delivery_type,  :packs_attribute, :dispatchers
  attr_accessor :dispatcher_emails

  def delivery
    @delivery
  end

  def delivery_changed?
    @delivery_changed
  end

  def trigger_time
    @delivery.trigger_time
  end

  as_enum :delivery_mode, {:standby => 0, :schedule => 1, :pickup => 2, :proxy =>3}, :column => 'delivery_type'


  validates_numericality_of :notify_span, :greater_than_or_equal_to => 0 , :less_than_or_equal_to => 6.months / 60
  validates_datetime :trigger_at, :after => lambda { Time.current } , :allow_blank => true #, :after_message => "should be after present  <= #{Time.now}"
  validates :name , :presence =>true, :uniqueness => {:scope =>'user_id'}


  def messages_by_pal pal_id
    Message.joins(:packs =>:pals).where({:packs =>{:box_id => self.id},:packs_pals =>{ :pal_id => pal_id}}).uniq()
  end

  def pals_by_message message_id
    Pal.joins(:packs).where({:packs =>{:box_id => self.id, :message_id => message_id}}).uniq()
  end

  def actives user_id
    Boxes.joins(:users).where(:trigger_at > Time.current)
  end

  def readings
    Reading.by_box self.id
  end

  def last_trigger_at
    return last_activation.trigger_at if last_activation != nil
    return ""
  end

  def reset_trigger
    self.trigger_at = nil
    self.notify_span = 0
    self.save
  end

  private

  def init
    @delivery = DeliveryFactory.getDelivery(self)

    self.lifetime = 60 if self.lifetime == 0
  end

  def set_delivery_status
    @delivery_changed = self.delivery_type_changed?
    if @delivery_changed
      @delivery.clear #remove any actions set with the previous delivery_type
      @delivery = DeliveryFactory.getDelivery(self)
      @delivery.reset #reset any uneeded properties
    end
    @delivery.init
    return  true # always return true to allow saving - if false record is not saved
  end

  def last_activation
    logger.info("TIME-NOW:#{Time.now.utc.strftime('%Y-%m-%d %H:%M')}'")
    logger.info("TIME-NOW:#{Time.now.utc.to_s(:db)} : box_id: #{self.id}'")
    box_activation = BoxActivation.where("user_id = #{self.user_id} and box_id =#{self.id} and trigger_at is not null and trigger_at < '#{Time.now.utc.to_s(:db)}'").last
  end


  def complete
    return  update_delivery?
  end

  def set_links?
    return false if !set_dispatcher_links?
  end

  def set_dispatcher_links? (roled_pals = self.dispatchers, pal_ids = self.pal_ids)
    pal_role ="dispatcher"
    pal_ids = roled_pals.map{|pal| pal.id}
    found_ids = Array.new

    unless pal_ids == nil
      pal_ids.split(",").collect { |pal_id|
        pal= Pal.where(:id => pal_id, :user_id => self.user_id).first()
        if  pal == nil
          pal = Pal.create(:email => pal_email, :user_id => self.user_id)
        end
        if !self.dispatchers.include?(pal)
          self.dispatchers << pal
          logger.info("#{pal_role}-new:" + pal.id.to_s)
          logger.info("new dispatcher: #{Pal.count} #{self.dispatchers.count}")
        else
          found_ids << pal.id
        end
      }
      #delete any removed pal
      logger.info("#{pal_role}-current:" + pal_ids.join(","))
      logger.info("#{pal_role}-found:" + found_ids.join(","))
      pals_to_unlink = pal_ids - found_ids
      unless pals_to_unlink == nil || pals_to_unlink.count == 0
        BoxesPal.delete_all(:box_id => self.id, :pal_id => pals_to_unlink)
        logger.info("#{pal_role}-removed:" + ( pals_to_unlink  ).join(","))
      end
    end
    return true
  end

  def update_delivery?
    @delivery.set
    return true
  end
end

class DeliveryFactory
  def self.getDelivery(context)
    type= context.delivery_type
    case type
    when Box.standby then return StandbyDelivery.new(context)
    when Box.schedule then return ScheduleDelivery.new(context)
    when Box.pickup then return PickupDelivery.new(context)
    when Box.proxy then return ProxyDelivery.new(context)
    else raise "delivery type #{type} unknown"
    end
  end
end

class Delivery
  def initialize(context)
    @context = context
  end

  def trigger_time
    nil
  end

  def init
    #default behavior => do nothing!
  end

  def set
    #default behavior => do nothing!
  end

  def reset
    #default behavior => do nothing!
  end


  def clear
    #default behavior => do nothing!
  end


end

class StandbyDelivery < Delivery

  def reset
    @context.trigger_at = nil
    @context.notify_span = 0
  end

end

class ScheduleDelivery < Delivery

  def initialize(context)
    super(context)
    @context = context
  end

  def init
    @trigger_at_changed = @context.trigger_at_changed?
    @trigger_at_previous = @context.trigger_at_was # ActiveRecord::Dirty
    @trigger_time_previous =  (@context.trigger_at_was)? @context.trigger_at_was - @context.notify_span_was.minutes : nil
    @trigger_time = @context.trigger_at - @context.notify_span.minutes
    @trigger_time_changed = @trigger_time != @trigger_time_previous
=begin
    Rails.logger.info("trigger_at-old: #{@context.trigger_at_was}")
    Rails.logger.info("trigger_at-new: #{@context.trigger_at}")
    Rails.logger.info("old: #{@context.notify_span_was}")
    Rails.logger.info("new: #{@context.notify_span}")
    Rails.logger.info("trigger_time-old: #{@trigger_time_previous}")
    Rails.logger.info("trigger_time-new: #{@trigger_time}")
    Rails.logger.info("trigger_time_changed:#{@trigger_time_changed}")
=end
  end

  def clear
    if @trigger_time_previous
      remove_delivery
    end
  end

  def set
    return if !@trigger_time_changed
    remove_delivery if  @trigger_time_previous
    add_delivery #set new timer
  end

  def trigger_time
    @context.trigger_at - @context.notify_span.minutes
  end

  def trigger_time_previous
    @trigger_time_previous
  end


  private

  def add_delivery
    activation_token = activate
    Resque.enqueue_at(self.trigger_time, BoxTriggerer,activation_token)
  end

  def remove_delivery
    box_activation = BoxActivation.where("user_id = #{@context.user_id} and box_id =#{@context.id} and trigger_at ='#{@trigger_time_previous.utc.to_s(:db)}'").first
    if box_activation
      Resque.remove_delayed(BoxTriggerer,box_activation.perishable_token)
      box_activation.delete # remove desactivated token
    end
  end

  def activate
    begin
      box_requestlist = BoxRequestlist.create(:user_id => @context.user_id, :pal_id => Pal.system_pal.id, :auto_box => @context)
      box_activation = BoxActivation.create(:box_id => @context.id, :user_id => @context.user_id, :pal_id => Pal.system_pal.id,:perishable_token => box_requestlist.perishable_token, :trigger_at => @trigger_time)
    rescue => exc
      logger.info("Box_activation NOT_SAVED:#{exc.message}")
    end
    box_activation.perishable_token
  end

end

class PickupDelivery < Delivery
  def reset
  end
end

class ProxyDelivery < Delivery
  def reset
    @context.trigger_at = nil
    @context.notify_span = 0
  end
end
