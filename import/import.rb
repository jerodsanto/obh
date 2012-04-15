require "rubygems"
require "mongo"
require "csv"
require "date"

class Bounty
  def initialize(csv_record)
    @code         = csv_record["rb_number"].strip rescue ""
    @how_affected = csv_record["how_affected"].strip rescue ""
    @type         = csv_record["type"].strip rescue ""
    @value        = csv_record["approx_value"].to_f
    @quantity     = csv_record["quantity"].to_i rescue 1
    @quantity = 1 if @quantity < 1
    @description  = csv_record["description"].strip rescue ""
    @recovered    = recovered?(csv_record["recovered_date"])
  end

  def good?
    !@description.empty? &&
    @how_affected == "STOLEN" &&
    @type != "MONEY" &&
    @value > 0
  end

  # all the unrecovered bounties have a date of 01/01/1900 12:00 AM
  def recovered?(date_string)
    date_string.strip[6..9].to_i > 1900
  rescue => e
    puts "error with: #{date_string}"
    raise e
  end

  def to_mongo
    {
      type: @type,
      description: @description,
      value: @value,
      quantity: @quantity
    }
  end
end

mongo_uri = ENV["MONGOHQ_URL"] || "mongodb://localhost:3002/meteor"
db_name = mongo_uri.slice(/\/(\w+)\z/, 1)
db = Mongo::Connection.from_uri(mongo_uri).db(db_name)
bounties = db.collection("bounties")
data_dir = File.join(File.dirname(__FILE__), "data")

bounties.remove

rando = 1

CSV.read("#{data_dir}/CRIME_property.csv", headers: true).each do |record|
  bounty = Bounty.new(record)

  if bounty.good?
    bounties.insert(bounty.to_mongo.merge({rando: rando}))
    rando += 1
  end
end

bounties.create_index "rando"
size = (bounties.stats["storageSize"] / 1024.0 / 1024.0).round(2)
puts "#{bounties.count} bounties ready to be hunted. Total size is #{size} MB."
