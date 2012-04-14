require "rubygems"
require "mongo"
require "csv"

class Bounty
  def initialize(csv_record)
    @code         = csv_record["rb_number"].strip rescue ""
    @how_affected = csv_record["how_affected"].strip rescue ""
    @type         = csv_record["type"].strip rescue ""
    @value        = csv_record["approx_value"].to_f
    @quantity     = csv_record["quantity"].to_i || 1 rescue 1
    @description  = csv_record["description"].strip rescue ""
  end

  def good?
    !@description.empty? &&
    @how_affected == "STOLEN" &&
    @type != "MONEY" &&
    @value > 0
  end

  def to_mongo
    instance_variables.each_with_object({}) do |ivar, hash|
      hash[ivar.to_s.gsub("@", "")] = instance_variable_get(ivar)
    end
  end
end

mongo = Mongo::Connection.new("localhost", 3002)
db = mongo.db("meteor")
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
puts "#{bounties.count} bounties ready to be hunted."
