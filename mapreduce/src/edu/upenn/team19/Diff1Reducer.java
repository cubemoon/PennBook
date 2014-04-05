package edu.upenn.team19;
import java.io.IOException;
import java.util.HashSet;
import java.util.Hashtable;

import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Mapper.Context;

public class Diff1Reducer extends Mapper<LongWritable, Text, Text, Text>{
	
	public void reduce(Text key, Iterable<Text> values, Context context) throws IOException, InterruptedException{
		
		Hashtable<String, Double> ranks = new Hashtable<String, Double>();
		
		for (Text value : values) {
			String name = value.toString().split("||")[1];
			Double rank = Double.parseDouble(value.toString().split("||")[0]);
			
			if (ranks.get(name) == null){
				ranks.put(name, rank);
			} else {
				Double diff = Math.abs(ranks.get(name) - rank);
				ranks.remove(name);
				context.write(new Text("diff"), new Text(diff.toString()));
			}
		}
		
		if (!ranks.keySet().isEmpty()) {
			System.out.println("Not all ranks have pairs. Shouldn't happen!");
		}
	}
}